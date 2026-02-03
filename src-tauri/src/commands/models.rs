use tauri::{AppHandle, Emitter, State};
use crate::state::AppState;
use crate::types::ModelSize;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub size: ModelSize,
    pub display_name: String,
    pub available: bool,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percent: f32,
}

#[tauri::command]
pub fn get_available_models(state: State<'_, AppState>) -> Vec<ModelInfo> {
    [ModelSize::Tiny, ModelSize::Small, ModelSize::Medium]
        .into_iter()
        .map(|size| ModelInfo {
            size,
            display_name: size.display_name().to_string(),
            available: state.model_manager.is_model_available(size),
            size_bytes: size.size_bytes(),
        })
        .collect()
}

#[tauri::command]
pub fn get_current_model(state: State<'_, AppState>) -> Result<ModelSize, String> {
    let settings = state.settings.read().map_err(|e| e.to_string())?;
    Ok(settings.whisper_model)
}

#[tauri::command]
pub async fn download_model(
    app: AppHandle,
    state: State<'_, AppState>,
    size: ModelSize,
) -> Result<(), String> {
    let model_manager = state.model_manager.clone();

    let downloaded = Arc::new(AtomicU64::new(0));
    let total = Arc::new(AtomicU64::new(size.size_bytes()));
    let app_clone = app.clone();
    let downloaded_clone = downloaded.clone();
    let total_clone = total.clone();

    let progress_callback = move |dl: u64, t: u64| {
        downloaded_clone.store(dl, Ordering::SeqCst);
        total_clone.store(t, Ordering::SeqCst);

        let progress = DownloadProgress {
            downloaded: dl,
            total: t,
            percent: (dl as f32 / t as f32) * 100.0,
        };

        let _ = app_clone.emit("model-download-progress", progress);
    };

    model_manager
        .download_model(size, progress_callback)
        .await?;

    let _ = app.emit("model-download-complete", size);

    Ok(())
}

#[tauri::command]
pub async fn delete_model(state: State<'_, AppState>, size: ModelSize) -> Result<(), String> {
    state.model_manager.delete_model(size).await
}

#[tauri::command]
pub fn switch_model(state: State<'_, AppState>, size: ModelSize) -> Result<(), String> {
    if !state.model_manager.is_model_available(size) {
        return Err(format!("Model {:?} is not available. Please download it first.", size));
    }

    let settings = state.settings.read().map_err(|e| e.to_string())?;
    let language = if settings.auto_detect_language {
        None
    } else {
        Some(settings.transcription_language.clone())
    };
    drop(settings);

    state.reload_engine(size, language)?;

    let mut settings = state.settings.write().map_err(|e| e.to_string())?;
    settings.whisper_model = size;
    drop(settings);

    let settings = state.settings.read().map_err(|e| e.to_string())?;
    crate::storage::config::save_settings(&settings)?;

    Ok(())
}

#[tauri::command]
pub fn is_engine_ready(state: State<'_, AppState>) -> bool {
    state.engine.read().map(|e| e.is_some()).unwrap_or(false)
}
