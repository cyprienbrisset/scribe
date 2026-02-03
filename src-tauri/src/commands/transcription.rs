use tauri::State;
use crate::engines::SpeechEngine;
use crate::state::AppState;
use crate::storage::history;
use crate::types::TranscriptionResult;
use crate::audio::AudioCapture;
use crate::voice_commands;
use crate::llm;
use std::cell::RefCell;

/// Taux d'échantillonnage requis par Whisper
const TARGET_SAMPLE_RATE: u32 = 16000;

thread_local! {
    static AUDIO_CAPTURE: RefCell<Option<AudioCapture>> = RefCell::new(None);
}

#[tauri::command]
pub fn start_recording(state: State<'_, AppState>) -> Result<(), String> {
    let mut is_recording = state.is_recording.write().map_err(|e| e.to_string())?;
    if *is_recording {
        return Err("Already recording".to_string());
    }

    let settings = state.settings.read().map_err(|e| e.to_string())?;
    let device_id = settings.microphone_id.clone();
    drop(settings);

    let mut capture = AudioCapture::new(device_id.as_deref())?;
    capture.start(device_id.as_deref())?;

    {
        let mut sr = state.sample_rate.write().map_err(|e| e.to_string())?;
        *sr = capture.sample_rate();
    }

    AUDIO_CAPTURE.with(|cell| {
        *cell.borrow_mut() = Some(capture);
    });

    *is_recording = true;
    log::info!("Recording started");
    Ok(())
}

#[tauri::command]
pub async fn stop_recording(state: State<'_, AppState>) -> Result<TranscriptionResult, String> {
    // Phase 1: Capture audio et transcription (synchrone, avec locks)
    let (result, voice_commands_enabled, dictation_mode, llm_enabled, llm_mode, duration_seconds) = {
        let mut is_recording = state.is_recording.write().map_err(|e| e.to_string())?;
        if !*is_recording {
            return Err("Not recording".to_string());
        }

        let (audio_buffer, sample_rate) = AUDIO_CAPTURE.with(|cell| -> Result<(Vec<f32>, u32), String> {
            let mut capture_opt = cell.borrow_mut();
            if let Some(ref mut capture) = *capture_opt {
                let result = capture.stop()?;
                *capture_opt = None;
                Ok(result)
            } else {
                Err("No active capture".to_string())
            }
        })?;

        *is_recording = false;
        drop(is_recording); // Libérer le lock d'écriture

        let duration_seconds = audio_buffer.len() as f32 / sample_rate as f32;

        if duration_seconds < 0.5 {
            return Err("Recording too short (minimum 0.5 seconds)".to_string());
        }

        let (resampled_audio, final_sample_rate) = if sample_rate != TARGET_SAMPLE_RATE {
            log::info!("Resampling audio from {}Hz to {}Hz", sample_rate, TARGET_SAMPLE_RATE);
            let resampled = resample_audio(&audio_buffer, sample_rate, TARGET_SAMPLE_RATE);
            (resampled, TARGET_SAMPLE_RATE)
        } else {
            (audio_buffer, sample_rate)
        };

        // Utiliser le moteur Whisper
        let engine_guard = state.engine.read().map_err(|e| e.to_string())?;
        let engine = engine_guard
            .as_ref()
            .ok_or("Whisper engine not initialized. Please download a model first.")?;

        let result = engine.transcribe(&resampled_audio, final_sample_rate)?;
        drop(engine_guard); // Libérer le lock du moteur

        // Lire les settings
        let settings = state.settings.read().map_err(|e| e.to_string())?;
        let voice_commands_enabled = settings.voice_commands_enabled;
        let dictation_mode = settings.dictation_mode;
        let llm_enabled = settings.llm_enabled;
        let llm_mode = settings.llm_mode;
        drop(settings); // Libérer le lock des settings

        (result, voice_commands_enabled, dictation_mode, llm_enabled, llm_mode, duration_seconds)
    };
    // Tous les locks sont libérés ici

    // Phase 2: Post-traitement (peut être async)
    let mut final_text = result.text.clone();

    // 1. Voice commands processing
    if voice_commands_enabled {
        let parse_result = voice_commands::parse(&final_text, dictation_mode);
        final_text = parse_result.text;
        // Les actions sont ignorées pour l'instant (future feature)
        if !parse_result.actions.is_empty() {
            log::info!("Voice commands detected: {:?}", parse_result.actions);
        }
    }

    // 2. LLM post-processing
    if llm_enabled {
        if let Some(api_key) = super::llm::get_groq_api_key_internal() {
            match llm::process(&final_text, llm_mode, dictation_mode, &api_key).await {
                Ok(processed) => {
                    log::info!("LLM processing successful");
                    final_text = processed;
                }
                Err(e) => {
                    log::warn!("LLM processing failed: {}", e);
                }
            }
        } else {
            log::warn!("LLM enabled but no API key found");
        }
    }

    // Créer le résultat final avec le texte post-traité
    let final_result = TranscriptionResult {
        text: final_text,
        confidence: result.confidence,
        duration_seconds: result.duration_seconds,
        processing_time_ms: result.processing_time_ms,
        detected_language: result.detected_language,
        timestamp: result.timestamp,
    };

    history::add_transcription(final_result.clone())?;

    log::info!("Recording stopped, duration: {:.1}s", duration_seconds);
    Ok(final_result)
}

#[tauri::command]
pub fn get_history() -> Result<Vec<TranscriptionResult>, String> {
    Ok(history::load_history().transcriptions)
}

#[tauri::command]
pub fn clear_history() -> Result<(), String> {
    history::clear_history()
}

#[tauri::command]
pub fn get_recording_status(state: State<'_, AppState>) -> Result<bool, String> {
    let is_recording = state.is_recording.read().map_err(|e| e.to_string())?;
    Ok(*is_recording)
}

fn resample_audio(input: &[f32], from_rate: u32, to_rate: u32) -> Vec<f32> {
    if from_rate == to_rate {
        return input.to_vec();
    }

    let ratio = from_rate as f64 / to_rate as f64;
    let output_len = (input.len() as f64 / ratio).ceil() as usize;
    let mut output = Vec::with_capacity(output_len);

    for i in 0..output_len {
        let src_idx = i as f64 * ratio;
        let idx_floor = src_idx.floor() as usize;
        let idx_ceil = (idx_floor + 1).min(input.len() - 1);
        let frac = src_idx - idx_floor as f64;

        let sample = if idx_floor < input.len() {
            let s1 = input[idx_floor];
            let s2 = input[idx_ceil];
            s1 + (s2 - s1) * frac as f32
        } else {
            0.0
        };

        output.push(sample);
    }

    output
}
