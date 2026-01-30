# WakaScribe MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer une application de dictée vocale macOS Intel avec transcription locale via OpenVINO.

**Architecture:** Application Tauri 2.x avec backend Rust (capture audio cpal + inférence OpenVINO) et frontend React/TypeScript (UI + stores Zustand). Fonctionnement 100% offline après installation.

**Tech Stack:** Tauri 2.x, Rust, React 18, TypeScript, TailwindCSS, Zustand, OpenVINO, cpal

---

## Task 1: Initialisation projet Tauri

**Files:**
- Create: `package.json`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/src/main.rs`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Step 1: Créer le projet Tauri**

```bash
npm create tauri-app@latest . -- --template react-ts --manager npm
```

**Step 2: Vérifier la structure créée**

```bash
ls -la src-tauri/src/
ls -la src/
```
Expected: `main.rs`, `lib.rs` dans src-tauri/src/ et `main.tsx`, `App.tsx` dans src/

**Step 3: Installer les dépendances frontend**

```bash
npm install zustand lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 4: Configurer TailwindCSS**

Modifier `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Modifier `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 5: Vérifier que l'app démarre**

```bash
npm run tauri dev
```
Expected: Fenêtre Tauri s'ouvre avec le template React

**Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: init Tauri 2.x project with React/TypeScript/Tailwind"
```

---

## Task 2: Configuration des plugins Tauri

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Ajouter les dépendances Rust**

Modifier `src-tauri/Cargo.toml`, section `[dependencies]`:
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-shell = "2"
tauri-plugin-global-shortcut = "2"
tauri-plugin-notification = "2"
tauri-plugin-clipboard-manager = "2"
tokio = { version = "1.35", features = ["full"] }
cpal = "0.15"
hound = "3.5"
sysinfo = "0.30"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
dirs = "5.0"
thiserror = "1.0"
log = "0.4"
env_logger = "0.11"
```

**Step 2: Installer les plugins npm**

```bash
npm install @tauri-apps/plugin-clipboard-manager @tauri-apps/plugin-global-shortcut @tauri-apps/plugin-notification @tauri-apps/plugin-shell
```

**Step 3: Configurer les plugins dans lib.rs**

Modifier `src-tauri/src/lib.rs`:
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 4: Configurer les permissions dans tauri.conf.json**

Ajouter dans `src-tauri/tauri.conf.json` sous `"app"`:
```json
{
  "plugins": {
    "global-shortcut": {
      "shortcuts": ["CommandOrControl+Shift+Space", "CommandOrControl+Shift+R"]
    },
    "notification": {
      "all": true
    },
    "clipboard-manager": {
      "all": true
    }
  }
}
```

**Step 5: Vérifier la compilation**

```bash
cd src-tauri && cargo check
```
Expected: Compilation réussie sans erreur

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Tauri plugins (shortcuts, clipboard, notifications)"
```

---

## Task 3: Types et structures de données

**Files:**
- Create: `src-tauri/src/types.rs`
- Create: `src/types/index.ts`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Créer les types Rust**

Créer `src-tauri/src/types.rs`:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionResult {
    pub text: String,
    pub confidence: f32,
    pub duration_seconds: f32,
    pub processing_time_ms: u64,
    pub detected_language: Option<String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub microphone_id: Option<String>,
    pub hotkey_push_to_talk: String,
    pub hotkey_toggle_record: String,
    pub transcription_language: String,
    pub auto_detect_language: bool,
    pub theme: String,
    pub minimize_to_tray: bool,
    pub auto_copy_to_clipboard: bool,
    pub notification_on_complete: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            microphone_id: None,
            hotkey_push_to_talk: "CommandOrControl+Shift+Space".to_string(),
            hotkey_toggle_record: "CommandOrControl+Shift+R".to_string(),
            transcription_language: "fr".to_string(),
            auto_detect_language: false,
            theme: "system".to_string(),
            minimize_to_tray: true,
            auto_copy_to_clipboard: true,
            notification_on_complete: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioDevice {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DictionaryData {
    pub words: Vec<String>,
}

impl Default for DictionaryData {
    fn default() -> Self {
        Self { words: vec![] }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryData {
    pub transcriptions: Vec<TranscriptionResult>,
}

impl Default for HistoryData {
    fn default() -> Self {
        Self { transcriptions: vec![] }
    }
}
```

**Step 2: Créer les types TypeScript**

Créer `src/types/index.ts`:
```typescript
export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration_seconds: number;
  processing_time_ms: number;
  detected_language: string | null;
  timestamp: number;
}

export interface AppSettings {
  microphone_id: string | null;
  hotkey_push_to_talk: string;
  hotkey_toggle_record: string;
  transcription_language: string;
  auto_detect_language: boolean;
  theme: 'light' | 'dark' | 'system';
  minimize_to_tray: boolean;
  auto_copy_to_clipboard: boolean;
  notification_on_complete: boolean;
}

export interface AudioDevice {
  id: string;
  name: string;
  is_default: boolean;
}

export type TranscriptionStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'error';
```

**Step 3: Exporter le module types dans lib.rs**

Ajouter en haut de `src-tauri/src/lib.rs`:
```rust
mod types;

pub use types::*;
```

**Step 4: Vérifier la compilation**

```bash
cd src-tauri && cargo check
```
Expected: Compilation réussie

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add shared types for Rust and TypeScript"
```

---

## Task 4: Module de stockage (config, historique, dictionnaire)

**Files:**
- Create: `src-tauri/src/storage/mod.rs`
- Create: `src-tauri/src/storage/config.rs`
- Create: `src-tauri/src/storage/dictionary.rs`
- Create: `src-tauri/src/storage/history.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Créer le module storage**

Créer `src-tauri/src/storage/mod.rs`:
```rust
pub mod config;
pub mod dictionary;
pub mod history;

use std::path::PathBuf;

pub fn get_app_data_dir() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("com.wakastellar.wakascribe")
}

pub fn ensure_app_data_dir() -> std::io::Result<PathBuf> {
    let dir = get_app_data_dir();
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}
```

**Step 2: Créer le module config**

Créer `src-tauri/src/storage/config.rs`:
```rust
use crate::types::AppSettings;
use std::fs;
use std::path::PathBuf;

fn config_path() -> PathBuf {
    super::get_app_data_dir().join("config.json")
}

pub fn load_settings() -> AppSettings {
    let path = config_path();
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    super::ensure_app_data_dir().map_err(|e| e.to_string())?;
    let path = config_path();
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}
```

**Step 3: Créer le module dictionary**

Créer `src-tauri/src/storage/dictionary.rs`:
```rust
use crate::types::DictionaryData;
use std::fs;
use std::path::PathBuf;

fn dictionary_path() -> PathBuf {
    super::get_app_data_dir().join("dictionary.json")
}

pub fn load_dictionary() -> DictionaryData {
    let path = dictionary_path();
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        DictionaryData::default()
    }
}

pub fn save_dictionary(data: &DictionaryData) -> Result<(), String> {
    super::ensure_app_data_dir().map_err(|e| e.to_string())?;
    let path = dictionary_path();
    let content = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn add_word(word: String) -> Result<(), String> {
    let mut data = load_dictionary();
    if !data.words.contains(&word) {
        data.words.push(word);
        save_dictionary(&data)?;
    }
    Ok(())
}

pub fn remove_word(word: &str) -> Result<(), String> {
    let mut data = load_dictionary();
    data.words.retain(|w| w != word);
    save_dictionary(&data)
}
```

**Step 4: Créer le module history**

Créer `src-tauri/src/storage/history.rs`:
```rust
use crate::types::{HistoryData, TranscriptionResult};
use std::fs;
use std::path::PathBuf;

const MAX_HISTORY: usize = 50;

fn history_path() -> PathBuf {
    super::get_app_data_dir().join("history.json")
}

pub fn load_history() -> HistoryData {
    let path = history_path();
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        HistoryData::default()
    }
}

pub fn save_history(data: &HistoryData) -> Result<(), String> {
    super::ensure_app_data_dir().map_err(|e| e.to_string())?;
    let path = history_path();
    let content = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn add_transcription(result: TranscriptionResult) -> Result<(), String> {
    let mut data = load_history();
    data.transcriptions.insert(0, result);
    data.transcriptions.truncate(MAX_HISTORY);
    save_history(&data)
}

pub fn clear_history() -> Result<(), String> {
    save_history(&HistoryData::default())
}
```

**Step 5: Mettre à jour lib.rs**

Ajouter dans `src-tauri/src/lib.rs`:
```rust
mod storage;
mod types;

pub use types::*;
```

**Step 6: Vérifier la compilation**

```bash
cd src-tauri && cargo check
```
Expected: Compilation réussie

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add storage module (config, dictionary, history)"
```

---

## Task 5: Module de capture audio

**Files:**
- Create: `src-tauri/src/audio/mod.rs`
- Create: `src-tauri/src/audio/capture.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Créer le module audio**

Créer `src-tauri/src/audio/mod.rs`:
```rust
pub mod capture;

pub use capture::*;
```

**Step 2: Créer le module capture**

Créer `src-tauri/src/audio/capture.rs`:
```rust
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, Host, Stream, StreamConfig};
use std::sync::{Arc, Mutex};

use crate::types::AudioDevice;

pub struct AudioCapture {
    stream: Option<Stream>,
    buffer: Arc<Mutex<Vec<f32>>>,
    sample_rate: u32,
}

impl AudioCapture {
    pub fn list_devices() -> Result<Vec<AudioDevice>, String> {
        let host = cpal::default_host();
        let default_device = host.default_input_device();
        let default_name = default_device.and_then(|d| d.name().ok());

        let devices: Vec<AudioDevice> = host
            .input_devices()
            .map_err(|e| e.to_string())?
            .filter_map(|device| {
                let name = device.name().ok()?;
                Some(AudioDevice {
                    id: name.clone(),
                    name: name.clone(),
                    is_default: Some(&name) == default_name.as_ref(),
                })
            })
            .collect();

        Ok(devices)
    }

    pub fn new(device_id: Option<&str>) -> Result<Self, String> {
        let host = cpal::default_host();
        let device = Self::get_device(&host, device_id)?;
        let config = device.default_input_config().map_err(|e| e.to_string())?;

        Ok(Self {
            stream: None,
            buffer: Arc::new(Mutex::new(Vec::new())),
            sample_rate: config.sample_rate().0,
        })
    }

    fn get_device(host: &Host, device_id: Option<&str>) -> Result<Device, String> {
        match device_id {
            Some(id) => host
                .input_devices()
                .map_err(|e| e.to_string())?
                .find(|d| d.name().ok().as_deref() == Some(id))
                .ok_or_else(|| format!("Device '{}' not found", id)),
            None => host
                .default_input_device()
                .ok_or_else(|| "No default input device".to_string()),
        }
    }

    pub fn start(&mut self, device_id: Option<&str>) -> Result<(), String> {
        let host = cpal::default_host();
        let device = Self::get_device(&host, device_id)?;
        let config = device.default_input_config().map_err(|e| e.to_string())?;

        self.sample_rate = config.sample_rate().0;
        self.buffer.lock().unwrap().clear();

        let buffer = self.buffer.clone();
        let config: StreamConfig = config.into();

        let stream = device
            .build_input_stream(
                &config,
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    let mut buf = buffer.lock().unwrap();
                    buf.extend_from_slice(data);
                },
                |err| {
                    log::error!("Audio stream error: {}", err);
                },
                None,
            )
            .map_err(|e| e.to_string())?;

        stream.play().map_err(|e| e.to_string())?;
        self.stream = Some(stream);

        Ok(())
    }

    pub fn stop(&mut self) -> Result<(Vec<f32>, u32), String> {
        self.stream = None;
        let buffer = self.buffer.lock().unwrap().clone();
        let sample_rate = self.sample_rate;
        self.buffer.lock().unwrap().clear();
        Ok((buffer, sample_rate))
    }

    pub fn is_recording(&self) -> bool {
        self.stream.is_some()
    }

    pub fn sample_rate(&self) -> u32 {
        self.sample_rate
    }
}
```

**Step 3: Mettre à jour lib.rs**

Ajouter dans `src-tauri/src/lib.rs`:
```rust
mod audio;
mod storage;
mod types;

pub use audio::*;
pub use types::*;
```

**Step 4: Vérifier la compilation**

```bash
cd src-tauri && cargo check
```
Expected: Compilation réussie

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add audio capture module with cpal"
```

---

## Task 6: État applicatif et commandes Tauri

**Files:**
- Create: `src-tauri/src/state.rs`
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/audio.rs`
- Create: `src-tauri/src/commands/settings.rs`
- Create: `src-tauri/src/commands/transcription.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Créer l'état applicatif**

Créer `src-tauri/src/state.rs`:
```rust
use std::sync::{Arc, RwLock, Mutex};
use crate::audio::AudioCapture;
use crate::types::AppSettings;
use crate::storage::config;

pub struct AppState {
    pub is_recording: Arc<RwLock<bool>>,
    pub settings: Arc<RwLock<AppSettings>>,
    pub audio_capture: Arc<Mutex<AudioCapture>>,
}

impl AppState {
    pub fn new() -> Result<Self, String> {
        let settings = config::load_settings();
        let audio_capture = AudioCapture::new(settings.microphone_id.as_deref())?;

        Ok(Self {
            is_recording: Arc::new(RwLock::new(false)),
            settings: Arc::new(RwLock::new(settings)),
            audio_capture: Arc::new(Mutex::new(audio_capture)),
        })
    }
}
```

**Step 2: Créer le module commands**

Créer `src-tauri/src/commands/mod.rs`:
```rust
pub mod audio;
pub mod settings;
pub mod transcription;

pub use audio::*;
pub use settings::*;
pub use transcription::*;
```

**Step 3: Créer les commandes audio**

Créer `src-tauri/src/commands/audio.rs`:
```rust
use crate::audio::AudioCapture;
use crate::types::AudioDevice;

#[tauri::command]
pub fn list_audio_devices() -> Result<Vec<AudioDevice>, String> {
    AudioCapture::list_devices()
}
```

**Step 4: Créer les commandes settings**

Créer `src-tauri/src/commands/settings.rs`:
```rust
use tauri::State;
use crate::state::AppState;
use crate::storage::{config, dictionary};
use crate::types::AppSettings;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.read().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn update_settings(state: State<'_, AppState>, new_settings: AppSettings) -> Result<(), String> {
    config::save_settings(&new_settings)?;
    let mut settings = state.settings.write().map_err(|e| e.to_string())?;
    *settings = new_settings;
    Ok(())
}

#[tauri::command]
pub fn get_dictionary() -> Result<Vec<String>, String> {
    Ok(dictionary::load_dictionary().words)
}

#[tauri::command]
pub fn add_dictionary_word(word: String) -> Result<(), String> {
    dictionary::add_word(word)
}

#[tauri::command]
pub fn remove_dictionary_word(word: String) -> Result<(), String> {
    dictionary::remove_word(&word)
}
```

**Step 5: Créer les commandes transcription (mock pour l'instant)**

Créer `src-tauri/src/commands/transcription.rs`:
```rust
use std::time::Instant;
use tauri::State;
use crate::state::AppState;
use crate::storage::history;
use crate::types::TranscriptionResult;

#[tauri::command]
pub fn start_recording(state: State<'_, AppState>) -> Result<(), String> {
    let mut is_recording = state.is_recording.write().map_err(|e| e.to_string())?;
    if *is_recording {
        return Err("Already recording".to_string());
    }

    let settings = state.settings.read().map_err(|e| e.to_string())?;
    let mut capture = state.audio_capture.lock().map_err(|e| e.to_string())?;
    capture.start(settings.microphone_id.as_deref())?;

    *is_recording = true;
    log::info!("Recording started");
    Ok(())
}

#[tauri::command]
pub fn stop_recording(state: State<'_, AppState>) -> Result<TranscriptionResult, String> {
    let mut is_recording = state.is_recording.write().map_err(|e| e.to_string())?;
    if !*is_recording {
        return Err("Not recording".to_string());
    }

    let start = Instant::now();

    let mut capture = state.audio_capture.lock().map_err(|e| e.to_string())?;
    let (audio_buffer, sample_rate) = capture.stop()?;

    *is_recording = false;

    let duration_seconds = audio_buffer.len() as f32 / sample_rate as f32;

    if duration_seconds < 0.5 {
        return Err("Recording too short (minimum 0.5 seconds)".to_string());
    }

    // TODO: Intégrer OpenVINO ici
    // Pour l'instant, on retourne un mock
    let result = TranscriptionResult {
        text: format!("[Mock] Audio capturé: {:.1}s à {}Hz", duration_seconds, sample_rate),
        confidence: 0.95,
        duration_seconds,
        processing_time_ms: start.elapsed().as_millis() as u64,
        detected_language: Some("fr".to_string()),
        timestamp: chrono::Utc::now().timestamp(),
    };

    // Sauvegarder dans l'historique
    history::add_transcription(result.clone())?;

    log::info!("Recording stopped, duration: {:.1}s", duration_seconds);
    Ok(result)
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
```

**Step 6: Ajouter chrono aux dépendances**

Modifier `src-tauri/Cargo.toml`, ajouter:
```toml
chrono = "0.4"
```

**Step 7: Mettre à jour lib.rs avec toutes les commandes**

Modifier `src-tauri/src/lib.rs`:
```rust
mod audio;
mod commands;
mod state;
mod storage;
mod types;

pub use audio::*;
pub use types::*;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    let app_state = AppState::new().expect("Failed to initialize app state");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::list_audio_devices,
            commands::get_settings,
            commands::update_settings,
            commands::get_dictionary,
            commands::add_dictionary_word,
            commands::remove_dictionary_word,
            commands::start_recording,
            commands::stop_recording,
            commands::get_history,
            commands::clear_history,
            commands::get_recording_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 8: Vérifier la compilation**

```bash
cd src-tauri && cargo check
```
Expected: Compilation réussie

**Step 9: Commit**

```bash
git add .
git commit -m "feat: add app state and Tauri commands"
```

---

## Task 7: Stores Zustand (Frontend)

**Files:**
- Create: `src/stores/transcriptionStore.ts`
- Create: `src/stores/settingsStore.ts`

**Step 1: Créer le store transcription**

Créer `src/stores/transcriptionStore.ts`:
```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { TranscriptionResult, TranscriptionStatus } from '../types';

interface TranscriptionStore {
  status: TranscriptionStatus;
  result: TranscriptionResult | null;
  history: TranscriptionResult[];
  error: string | null;

  startRecording: () => Promise<void>;
  stopRecording: () => Promise<TranscriptionResult>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  clearError: () => void;
}

export const useTranscriptionStore = create<TranscriptionStore>((set, get) => ({
  status: 'idle',
  result: null,
  history: [],
  error: null,

  startRecording: async () => {
    try {
      set({ status: 'recording', error: null });
      await invoke('start_recording');
    } catch (error) {
      set({ status: 'error', error: String(error) });
      throw error;
    }
  },

  stopRecording: async () => {
    try {
      set({ status: 'processing' });
      const result = await invoke<TranscriptionResult>('stop_recording');
      set((state) => ({
        status: 'completed',
        result,
        history: [result, ...state.history].slice(0, 50),
      }));
      return result;
    } catch (error) {
      set({ status: 'error', error: String(error) });
      throw error;
    }
  },

  loadHistory: async () => {
    try {
      const history = await invoke<TranscriptionResult[]>('get_history');
      set({ history });
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  },

  clearHistory: async () => {
    try {
      await invoke('clear_history');
      set({ history: [] });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },

  clearError: () => set({ error: null, status: 'idle' }),
}));
```

**Step 2: Créer le store settings**

Créer `src/stores/settingsStore.ts`:
```typescript
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { AppSettings, AudioDevice } from '../types';

interface SettingsStore {
  settings: AppSettings | null;
  devices: AudioDevice[];
  dictionary: string[];
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  loadDevices: () => Promise<void>;
  loadDictionary: () => Promise<void>;
  addWord: (word: string) => Promise<void>;
  removeWord: (word: string) => Promise<void>;
}

const defaultSettings: AppSettings = {
  microphone_id: null,
  hotkey_push_to_talk: 'CommandOrControl+Shift+Space',
  hotkey_toggle_record: 'CommandOrControl+Shift+R',
  transcription_language: 'fr',
  auto_detect_language: false,
  theme: 'system',
  minimize_to_tray: true,
  auto_copy_to_clipboard: true,
  notification_on_complete: true,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  devices: [],
  dictionary: [],
  isLoading: false,

  loadSettings: async () => {
    try {
      set({ isLoading: true });
      const settings = await invoke<AppSettings>('get_settings');
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ settings: defaultSettings, isLoading: false });
    }
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const current = get().settings || defaultSettings;
    const updated = { ...current, ...newSettings };
    try {
      await invoke('update_settings', { newSettings: updated });
      set({ settings: updated });
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  loadDevices: async () => {
    try {
      const devices = await invoke<AudioDevice[]>('list_audio_devices');
      set({ devices });
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  },

  loadDictionary: async () => {
    try {
      const dictionary = await invoke<string[]>('get_dictionary');
      set({ dictionary });
    } catch (error) {
      console.error('Failed to load dictionary:', error);
    }
  },

  addWord: async (word: string) => {
    try {
      await invoke('add_dictionary_word', { word });
      set((state) => ({ dictionary: [...state.dictionary, word] }));
    } catch (error) {
      console.error('Failed to add word:', error);
      throw error;
    }
  },

  removeWord: async (word: string) => {
    try {
      await invoke('remove_dictionary_word', { word });
      set((state) => ({ dictionary: state.dictionary.filter((w) => w !== word) }));
    } catch (error) {
      console.error('Failed to remove word:', error);
      throw error;
    }
  },
}));
```

**Step 3: Vérifier la syntaxe TypeScript**

```bash
npm run build
```
Expected: Build réussi (peut échouer sur l'app React, c'est normal)

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Zustand stores (transcription, settings)"
```

---

## Task 8: Composants React UI

**Files:**
- Create: `src/components/DictationPanel.tsx`
- Create: `src/components/TranscriptionHistory.tsx`
- Create: `src/components/SettingsPanel.tsx`
- Modify: `src/App.tsx`

**Step 1: Créer le composant DictationPanel**

Créer `src/components/DictationPanel.tsx`:
```tsx
import { useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { useTranscriptionStore } from '../stores/transcriptionStore';
import { useSettingsStore } from '../stores/settingsStore';

export function DictationPanel() {
  const { status, result, error, startRecording, stopRecording, clearError } = useTranscriptionStore();
  const { settings } = useSettingsStore();

  const handleToggle = async () => {
    try {
      if (status === 'recording') {
        const transcription = await stopRecording();
        if (settings?.auto_copy_to_clipboard && transcription.text) {
          await writeText(transcription.text);
        }
      } else if (status === 'idle' || status === 'completed' || status === 'error') {
        await startRecording();
      }
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const getButtonClasses = () => {
    const base = 'w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all duration-200';
    switch (status) {
      case 'recording':
        return `${base} bg-red-500 hover:bg-red-600 animate-pulse`;
      case 'processing':
        return `${base} bg-gray-400 cursor-not-allowed`;
      default:
        return `${base} bg-blue-500 hover:bg-blue-600 hover:scale-105`;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'recording':
        return 'Enregistrement en cours...';
      case 'processing':
        return 'Transcription...';
      case 'completed':
        return 'Transcription terminée';
      case 'error':
        return 'Erreur';
      default:
        return 'Cliquez pour dicter';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-8">
      <button
        onClick={handleToggle}
        disabled={status === 'processing'}
        className={getButtonClasses()}
        aria-label={status === 'recording' ? 'Arrêter' : 'Démarrer'}
      >
        {status === 'processing' ? (
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        ) : status === 'recording' ? (
          <MicOff className="w-16 h-16 text-white" />
        ) : (
          <Mic className="w-16 h-16 text-white" />
        )}
      </button>

      <p className="text-lg text-gray-600 dark:text-gray-300">{getStatusText()}</p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p>{error}</p>
          <button onClick={clearError} className="text-sm underline mt-2">
            Fermer
          </button>
        </div>
      )}

      {result && status === 'completed' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-lg shadow-lg">
          <p className="text-gray-900 dark:text-gray-100 text-lg leading-relaxed">
            {result.text}
          </p>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500">
              {result.processing_time_ms}ms • {(result.confidence * 100).toFixed(0)}% confiance
            </span>
            <span className="text-sm text-gray-500">
              {result.duration_seconds.toFixed(1)}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Créer le composant TranscriptionHistory**

Créer `src/components/TranscriptionHistory.tsx`:
```tsx
import { useEffect } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { useTranscriptionStore } from '../stores/transcriptionStore';

export function TranscriptionHistory() {
  const { history, loadHistory, clearHistory } = useTranscriptionStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (history.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucun historique</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Historique ({history.length})
        </h2>
        <button
          onClick={clearHistory}
          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Effacer l'historique"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((item, index) => (
          <div
            key={`${item.timestamp}-${index}`}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <p className="text-gray-900 dark:text-gray-100 line-clamp-3">{item.text}</p>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{formatDate(item.timestamp)}</span>
              <span>{item.duration_seconds.toFixed(1)}s</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Créer le composant SettingsPanel**

Créer `src/components/SettingsPanel.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Settings, X, Plus, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, devices, dictionary, loadSettings, loadDevices, loadDictionary, updateSettings, addWord, removeWord } = useSettingsStore();
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadDevices();
      loadDictionary();
    }
  }, [isOpen, loadSettings, loadDevices, loadDictionary]);

  const handleAddWord = async () => {
    if (newWord.trim()) {
      await addWord(newWord.trim());
      setNewWord('');
    }
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Paramètres
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Microphone */}
          <div>
            <label className="block text-sm font-medium mb-2">Microphone</label>
            <select
              value={settings.microphone_id || ''}
              onChange={(e) => updateSettings({ microphone_id: e.target.value || null })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Par défaut</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} {device.is_default ? '(défaut)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Langue */}
          <div>
            <label className="block text-sm font-medium mb-2">Langue de transcription</label>
            <select
              value={settings.transcription_language}
              onChange={(e) => updateSettings({ transcription_language: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
              <option value="auto">Auto-détection</option>
            </select>
          </div>

          {/* Thème */}
          <div>
            <label className="block text-sm font-medium mb-2">Thème</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="system">Système</option>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.auto_copy_to_clipboard}
                onChange={(e) => updateSettings({ auto_copy_to_clipboard: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Copier automatiquement dans le presse-papier</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notification_on_complete}
                onChange={(e) => updateSettings({ notification_on_complete: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Notification à la fin de la transcription</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.minimize_to_tray}
                onChange={(e) => updateSettings({ minimize_to_tray: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Minimiser dans la barre système</span>
            </label>
          </div>

          {/* Raccourcis */}
          <div>
            <label className="block text-sm font-medium mb-2">Raccourcis clavier</label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <span>Push-to-talk</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                  {settings.hotkey_push_to_talk}
                </kbd>
              </div>
              <div className="flex justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <span>Toggle record</span>
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                  {settings.hotkey_toggle_record}
                </kbd>
              </div>
            </div>
          </div>

          {/* Dictionnaire */}
          <div>
            <label className="block text-sm font-medium mb-2">Dictionnaire personnalisé</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                placeholder="Ajouter un mot..."
                className="flex-1 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
              <button
                onClick={handleAddWord}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dictionary.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                >
                  {word}
                  <button onClick={() => removeWord(word)} className="hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Mettre à jour App.tsx**

Modifier `src/App.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Settings, History } from 'lucide-react';
import { DictationPanel } from './components/DictationPanel';
import { TranscriptionHistory } from './components/TranscriptionHistory';
import { SettingsPanel } from './components/SettingsPanel';
import { useSettingsStore } from './stores/settingsStore';
import './index.css';

type Tab = 'dictation' | 'history';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dictation');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">WakaScribe</h1>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('dictation')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'dictation'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dictée
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            Historique
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto max-w-2xl">
        {activeTab === 'dictation' ? <DictationPanel /> : <TranscriptionHistory />}
      </main>

      {/* Settings Panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
```

**Step 5: Vérifier le build frontend**

```bash
npm run build
```
Expected: Build réussi

**Step 6: Tester l'application**

```bash
npm run tauri dev
```
Expected: Application s'ouvre avec l'interface complète

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add React UI components (DictationPanel, History, Settings)"
```

---

## Task 9: Hotkeys globaux

**Files:**
- Create: `src/hooks/useHotkeys.ts`
- Modify: `src/App.tsx`

**Step 1: Créer le hook useHotkeys**

Créer `src/hooks/useHotkeys.ts`:
```typescript
import { useEffect, useRef } from 'react';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { useTranscriptionStore } from '../stores/transcriptionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

export function useHotkeys() {
  const { status, startRecording, stopRecording } = useTranscriptionStore();
  const { settings } = useSettingsStore();
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!settings) return;

    const handleToggle = async () => {
      if (statusRef.current === 'recording') {
        const result = await stopRecording();
        if (settings.auto_copy_to_clipboard && result.text) {
          await writeText(result.text);
        }
      } else if (statusRef.current === 'idle' || statusRef.current === 'completed') {
        await startRecording();
      }
    };

    const setupHotkeys = async () => {
      try {
        // Toggle record hotkey
        await register(settings.hotkey_toggle_record, handleToggle);
        console.log('Hotkey registered:', settings.hotkey_toggle_record);
      } catch (error) {
        console.error('Failed to register hotkey:', error);
      }
    };

    setupHotkeys();

    return () => {
      unregister(settings.hotkey_toggle_record).catch(console.error);
    };
  }, [settings?.hotkey_toggle_record, settings?.auto_copy_to_clipboard, startRecording, stopRecording]);
}
```

**Step 2: Utiliser le hook dans App.tsx**

Ajouter dans `src/App.tsx` après les imports:
```typescript
import { useHotkeys } from './hooks/useHotkeys';
```

Et dans le composant App, après les useState:
```typescript
useHotkeys();
```

**Step 3: Tester les hotkeys**

```bash
npm run tauri dev
```
Expected: Cmd+Shift+R démarre/arrête l'enregistrement

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add global hotkeys support"
```

---

## Task 10: System Tray

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/icons/tray-icon.png`

**Step 1: Ajouter l'icône tray**

Copier une icône 32x32 PNG vers `src-tauri/icons/tray-icon.png` (ou utiliser l'icône existante).

**Step 2: Configurer le tray dans lib.rs**

Modifier `src-tauri/src/lib.rs`:
```rust
mod audio;
mod commands;
mod state;
mod storage;
mod types;

pub use audio::*;
pub use types::*;

use state::AppState;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    let app_state = AppState::new().expect("Failed to initialize app state");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::list_audio_devices,
            commands::get_settings,
            commands::update_settings,
            commands::get_dictionary,
            commands::add_dictionary_word,
            commands::remove_dictionary_word,
            commands::start_recording,
            commands::stop_recording,
            commands::get_history,
            commands::clear_history,
            commands::get_recording_status,
        ])
        .setup(|app| {
            // Create tray menu
            let quit_item = MenuItem::with_id(app, "quit", "Quitter WakaScribe", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Afficher", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Create tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 3: Vérifier la compilation**

```bash
cd src-tauri && cargo check
```
Expected: Compilation réussie

**Step 4: Tester le tray**

```bash
npm run tauri dev
```
Expected: Icône dans la barre système, menu contextuel fonctionnel

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add system tray with menu"
```

---

## Task 11: Intégration OpenVINO (Structure de base)

**Files:**
- Create: `src-tauri/src/engines/mod.rs`
- Create: `src-tauri/src/engines/traits.rs`
- Create: `src-tauri/src/engines/openvino.rs`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`

**Note:** L'intégration complète OpenVINO nécessite le SDK OpenVINO installé sur le système. Cette tâche crée la structure et un mock fonctionnel.

**Step 1: Ajouter openvino aux dépendances (optionnel)**

Modifier `src-tauri/Cargo.toml`:
```toml
[dependencies]
# ... autres dépendances ...
# openvino = { version = "0.6", optional = true }

[features]
default = []
# openvino = ["dep:openvino"]
```

**Step 2: Créer le module engines**

Créer `src-tauri/src/engines/mod.rs`:
```rust
pub mod traits;
pub mod openvino;

pub use traits::*;
pub use openvino::*;
```

**Step 3: Créer le trait SpeechEngine**

Créer `src-tauri/src/engines/traits.rs`:
```rust
use crate::types::TranscriptionResult;

pub trait SpeechEngine: Send + Sync {
    fn transcribe(&self, audio: &[f32], sample_rate: u32) -> Result<TranscriptionResult, String>;
    fn name(&self) -> &str;
}
```

**Step 4: Créer le moteur OpenVINO (mock)**

Créer `src-tauri/src/engines/openvino.rs`:
```rust
use crate::engines::traits::SpeechEngine;
use crate::types::TranscriptionResult;
use std::time::Instant;

pub struct OpenVINOEngine {
    model_path: String,
    language: String,
}

impl OpenVINOEngine {
    pub fn new(model_path: &str, language: &str) -> Result<Self, String> {
        // TODO: Charger le vrai modèle OpenVINO
        log::info!("Initializing OpenVINO engine with model: {}", model_path);
        Ok(Self {
            model_path: model_path.to_string(),
            language: language.to_string(),
        })
    }

    pub fn mock() -> Self {
        Self {
            model_path: "mock".to_string(),
            language: "fr".to_string(),
        }
    }
}

impl SpeechEngine for OpenVINOEngine {
    fn transcribe(&self, audio: &[f32], sample_rate: u32) -> Result<TranscriptionResult, String> {
        let start = Instant::now();
        let duration_seconds = audio.len() as f32 / sample_rate as f32;

        // TODO: Implémenter la vraie transcription OpenVINO
        // Pour l'instant, retourne un mock
        let text = format!(
            "[OpenVINO Mock] Audio de {:.1} secondes transcrit en {}",
            duration_seconds, self.language
        );

        Ok(TranscriptionResult {
            text,
            confidence: 0.92,
            duration_seconds,
            processing_time_ms: start.elapsed().as_millis() as u64 + 100, // Simule un délai
            detected_language: Some(self.language.clone()),
            timestamp: chrono::Utc::now().timestamp(),
        })
    }

    fn name(&self) -> &str {
        "OpenVINO"
    }
}
```

**Step 5: Mettre à jour state.rs pour utiliser le moteur**

Modifier `src-tauri/src/state.rs`:
```rust
use std::sync::{Arc, Mutex, RwLock};
use crate::audio::AudioCapture;
use crate::engines::{OpenVINOEngine, SpeechEngine};
use crate::storage::config;
use crate::types::AppSettings;

pub struct AppState {
    pub is_recording: Arc<RwLock<bool>>,
    pub settings: Arc<RwLock<AppSettings>>,
    pub audio_capture: Arc<Mutex<AudioCapture>>,
    pub engine: Arc<dyn SpeechEngine>,
}

impl AppState {
    pub fn new() -> Result<Self, String> {
        let settings = config::load_settings();
        let audio_capture = AudioCapture::new(settings.microphone_id.as_deref())?;
        let engine = OpenVINOEngine::mock();

        Ok(Self {
            is_recording: Arc::new(RwLock::new(false)),
            settings: Arc::new(RwLock::new(settings)),
            audio_capture: Arc::new(Mutex::new(audio_capture)),
            engine: Arc::new(engine),
        })
    }
}
```

**Step 6: Mettre à jour transcription.rs pour utiliser le moteur**

Modifier `src-tauri/src/commands/transcription.rs`, fonction `stop_recording`:
```rust
#[tauri::command]
pub fn stop_recording(state: State<'_, AppState>) -> Result<TranscriptionResult, String> {
    let mut is_recording = state.is_recording.write().map_err(|e| e.to_string())?;
    if !*is_recording {
        return Err("Not recording".to_string());
    }

    let mut capture = state.audio_capture.lock().map_err(|e| e.to_string())?;
    let (audio_buffer, sample_rate) = capture.stop()?;

    *is_recording = false;

    let duration_seconds = audio_buffer.len() as f32 / sample_rate as f32;

    if duration_seconds < 0.5 {
        return Err("Recording too short (minimum 0.5 seconds)".to_string());
    }

    // Utiliser le moteur de transcription
    let result = state.engine.transcribe(&audio_buffer, sample_rate)?;

    // Sauvegarder dans l'historique
    crate::storage::history::add_transcription(result.clone())?;

    log::info!("Transcription completed: {} chars in {}ms", result.text.len(), result.processing_time_ms);
    Ok(result)
}
```

**Step 7: Mettre à jour lib.rs**

Ajouter dans `src-tauri/src/lib.rs`:
```rust
mod audio;
mod commands;
mod engines;
mod state;
mod storage;
mod types;
```

**Step 8: Vérifier la compilation**

```bash
cd src-tauri && cargo check
```
Expected: Compilation réussie

**Step 9: Commit**

```bash
git add .
git commit -m "feat: add speech engine architecture with OpenVINO mock"
```

---

## Task 12: Tests et finalisation

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/tests/integration_test.rs`

**Step 1: Créer des tests d'intégration basiques**

Créer `src-tauri/tests/integration_test.rs`:
```rust
use wakascribe::{AudioCapture, TranscriptionResult};

#[test]
fn test_list_audio_devices() {
    let devices = AudioCapture::list_devices();
    assert!(devices.is_ok());
}

#[test]
fn test_transcription_result_serialization() {
    let result = TranscriptionResult {
        text: "Test transcription".to_string(),
        confidence: 0.95,
        duration_seconds: 2.5,
        processing_time_ms: 150,
        detected_language: Some("fr".to_string()),
        timestamp: 1234567890,
    };

    let json = serde_json::to_string(&result).unwrap();
    let parsed: TranscriptionResult = serde_json::from_str(&json).unwrap();

    assert_eq!(result.text, parsed.text);
    assert_eq!(result.confidence, parsed.confidence);
}
```

**Step 2: Exporter les types nécessaires dans lib.rs**

S'assurer que `src-tauri/src/lib.rs` exporte correctement:
```rust
mod audio;
mod commands;
mod engines;
mod state;
mod storage;
mod types;

pub use audio::AudioCapture;
pub use types::*;
```

**Step 3: Lancer les tests**

```bash
cd src-tauri && cargo test
```
Expected: Tests passent

**Step 4: Lancer l'application complète**

```bash
npm run tauri dev
```
Expected: Application fonctionnelle avec:
- Bouton d'enregistrement
- Hotkeys (Cmd+Shift+R)
- Historique
- Paramètres
- System tray

**Step 5: Build de production**

```bash
npm run tauri build
```
Expected: Build réussi, application dans `src-tauri/target/release/bundle/`

**Step 6: Commit final**

```bash
git add .
git commit -m "feat: add integration tests and finalize MVP structure"
```

---

## Résumé

Le MVP comprend:
- ✅ Structure Tauri 2.x complète
- ✅ Capture audio avec cpal
- ✅ Architecture moteur STT (mock OpenVINO)
- ✅ Interface React complète (dictée, historique, paramètres)
- ✅ Stores Zustand
- ✅ Hotkeys globaux
- ✅ System tray
- ✅ Persistance (config, dictionnaire, historique)

**Prochaine étape:** Intégrer le vrai modèle OpenVINO Parakeet pour la transcription réelle.
