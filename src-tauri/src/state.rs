use std::sync::{Arc, RwLock};
use tauri::{AppHandle, Manager};

use crate::engines::OpenVINOEngine;
use crate::storage::config;
use crate::types::AppSettings;

/// Thread-safe application state for Tauri
/// Note: AudioCapture is not stored here because cpal::Stream is not Send+Sync.
/// Audio capture is managed per-command in transcription.rs using thread_local storage.
pub struct AppState {
    pub is_recording: Arc<RwLock<bool>>,
    pub settings: Arc<RwLock<AppSettings>>,
    pub sample_rate: Arc<RwLock<u32>>,
    pub engine: Arc<OpenVINOEngine>,
}

impl AppState {
    pub fn new(app_handle: &AppHandle) -> Result<Self, String> {
        let settings = config::load_settings();

        // Obtenir le chemin des ressources
        let resource_path = app_handle.path()
            .resource_dir()
            .map_err(|e| format!("Failed to get resource dir: {}", e))?;

        log::info!("Resource path: {:?}", resource_path);

        // Initialiser le moteur OpenVINO
        let engine = OpenVINOEngine::new(&resource_path, &settings.transcription_language)
            .map_err(|e| format!("Failed to initialize OpenVINO engine: {}", e))?;

        Ok(Self {
            is_recording: Arc::new(RwLock::new(false)),
            settings: Arc::new(RwLock::new(settings)),
            sample_rate: Arc::new(RwLock::new(16000)),
            engine: Arc::new(engine),
        })
    }
}
