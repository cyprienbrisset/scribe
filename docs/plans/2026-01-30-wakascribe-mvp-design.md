# WakaScribe MVP - Document de Design

**Date:** 30 janvier 2026
**Propriétaire:** Cyprien BRISSET
**Statut:** Validé

---

## 1. Contexte et décisions

| Aspect | Choix |
|--------|-------|
| Plateforme cible | macOS Intel |
| Moteur STT | OpenVINO (parakeet-tdt-0.6b-v3-ov) |
| Authentification | Sans (MVP) |
| Interface | Complète (tray, notifications, dictionnaire, paramètres) |
| Langue | Français par défaut, multilingue disponible |

---

## 2. Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ DictationPanel│ │SettingsPanel│ │TranscriptionHist│ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                   │          │
│  ┌──────┴────────────────┴───────────────────┴───────┐ │
│  │              Zustand Stores                        │ │
│  │   transcriptionStore  │  settingsStore            │ │
│  └──────────────────────┬────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────┘
                          │ invoke()
┌─────────────────────────┼───────────────────────────────┐
│                    Backend (Rust/Tauri)                 │
│  ┌──────────────────────┴────────────────────────────┐ │
│  │              Tauri Commands                        │ │
│  │  start_recording │ stop_recording │ get_settings  │ │
│  └───────┬──────────────────┬────────────────┬───────┘ │
│          │                  │                │         │
│  ┌───────┴───────┐  ┌───────┴───────┐  ┌─────┴──────┐ │
│  │ AudioCapture  │  │ OpenVINOEngine │  │  Storage   │ │
│  │    (cpal)     │  │  (inference)   │  │   (JSON)   │ │
│  └───────────────┘  └───────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Flux principal :**
```
Hotkey/Bouton → Backend (capture audio) → OpenVINO (transcription)
→ Frontend (affichage) → Clipboard (copie auto)
```

---

## 3. Structure du projet

```
wakascribe/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs              # Point d'entrée Tauri
│   │   ├── lib.rs               # Exports des modules
│   │   ├── state.rs             # AppState partagé
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── transcription.rs # start_recording, stop_recording
│   │   │   ├── audio.rs         # list_devices, set_device
│   │   │   └── settings.rs      # get_settings, update_settings
│   │   ├── engines/
│   │   │   ├── mod.rs
│   │   │   ├── openvino.rs      # Moteur OpenVINO
│   │   │   └── traits.rs        # Trait SpeechEngine
│   │   ├── audio/
│   │   │   ├── mod.rs
│   │   │   ├── capture.rs       # AudioCapture avec cpal
│   │   │   └── buffer.rs        # Buffer audio
│   │   └── storage/
│   │       ├── mod.rs
│   │       ├── config.rs        # Paramètres JSON
│   │       └── dictionary.rs    # Dictionnaire perso
│   └── models/
│       └── parakeet-openvino/   # Modèle embarqué
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── DictationPanel.tsx
│   │   ├── TranscriptionHistory.tsx
│   │   ├── SettingsPanel.tsx
│   │   ├── MicrophoneSelector.tsx
│   │   ├── HotkeyConfig.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── TrayMenu.tsx
│   ├── stores/
│   │   ├── transcriptionStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/
│   │   ├── useHotkeys.ts
│   │   └── useAudioLevel.ts
│   └── types/
│       └── index.ts
├── docs/
│   └── plans/
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── CLAUDE.MD
└── PRD.MD
```

---

## 4. Backend Rust

### 4.1 Dépendances (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2.0", features = ["tray-icon"] }
tauri-plugin-shell = "2.0"
tauri-plugin-global-shortcut = "2.0"
tauri-plugin-notification = "2.0"
tauri-plugin-clipboard-manager = "2.0"
tokio = { version = "1.35", features = ["full"] }
cpal = "0.15"
hound = "3.5"
openvino = "0.5"
sysinfo = "0.30"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
dirs = "5.0"
thiserror = "1.0"
log = "0.4"
env_logger = "0.10"
```

### 4.2 AppState

```rust
pub struct AppState {
    pub is_recording: Arc<RwLock<bool>>,
    pub engine: Arc<OpenVINOEngine>,
    pub settings: Arc<RwLock<AppSettings>>,
    pub audio_capture: Arc<Mutex<Option<AudioCapture>>>,
}
```

### 4.3 Types principaux

```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct TranscriptionResult {
    pub text: String,
    pub confidence: f32,
    pub duration_seconds: f32,
    pub processing_time_ms: u64,
    pub detected_language: Option<String>,
    pub timestamp: i64,
}

#[derive(Serialize, Deserialize, Clone)]
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

#[derive(Serialize, Deserialize, Clone)]
pub struct AudioDevice {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}
```

### 4.4 Commandes Tauri

```rust
#[tauri::command]
async fn start_recording(state: State<'_, AppState>) -> Result<(), String>;

#[tauri::command]
async fn stop_recording(state: State<'_, AppState>) -> Result<TranscriptionResult, String>;

#[tauri::command]
async fn list_audio_devices() -> Result<Vec<AudioDevice>, String>;

#[tauri::command]
async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String>;

#[tauri::command]
async fn update_settings(state: State<'_, AppState>, settings: AppSettings) -> Result<(), String>;

#[tauri::command]
async fn get_history(state: State<'_, AppState>) -> Result<Vec<TranscriptionResult>, String>;

#[tauri::command]
async fn add_dictionary_word(word: String) -> Result<(), String>;

#[tauri::command]
async fn remove_dictionary_word(word: String) -> Result<(), String>;

#[tauri::command]
async fn get_dictionary() -> Result<Vec<String>, String>;
```

---

## 5. Frontend React

### 5.1 Dépendances (package.json)

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-clipboard-manager": "^2.0.0",
    "@tauri-apps/plugin-global-shortcut": "^2.0.0",
    "@tauri-apps/plugin-notification": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 5.2 Types TypeScript

```typescript
interface TranscriptionResult {
  text: string;
  confidence: number;
  duration_seconds: number;
  processing_time_ms: number;
  detected_language: string | null;
  timestamp: number;
}

interface AppSettings {
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

interface AudioDevice {
  id: string;
  name: string;
  is_default: boolean;
}

type TranscriptionStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'error';
```

### 5.3 Stores Zustand

**transcriptionStore.ts :**
- `status: TranscriptionStatus`
- `result: TranscriptionResult | null`
- `history: TranscriptionResult[]`
- `error: string | null`
- `startRecording(): Promise<void>`
- `stopRecording(): Promise<TranscriptionResult>`
- `loadHistory(): Promise<void>`

**settingsStore.ts :**
- `settings: AppSettings`
- `devices: AudioDevice[]`
- `loadSettings(): Promise<void>`
- `updateSettings(settings: Partial<AppSettings>): Promise<void>`
- `loadDevices(): Promise<void>`

---

## 6. Hotkeys et System Tray

### 6.1 Raccourcis par défaut

| Action | Raccourci | Comportement |
|--------|-----------|--------------|
| Push-to-talk | `Cmd+Shift+Space` | Enregistre tant que maintenu |
| Toggle record | `Cmd+Shift+R` | Start/Stop alternativement |

### 6.2 Menu System Tray

```
🎤 Démarrer dictée / Arrêter dictée
⏸️ Pause (désactive hotkeys)
───────────────
⚙️ Paramètres...
───────────────
🚪 Quitter WakaScribe
```

### 6.3 Comportement fenêtre

- Fermer fenêtre → minimise dans tray
- Click icône tray → affiche/masque fenêtre
- Double-click icône → ouvre fenêtre principale

---

## 7. Stockage

### 7.1 Emplacement

```
~/Library/Application Support/com.wakastellar.wakascribe/
├── config.json
├── dictionary.json
└── history.json
```

### 7.2 Schémas

**config.json :**
```json
{
  "microphone_id": null,
  "hotkey_push_to_talk": "CommandOrControl+Shift+Space",
  "hotkey_toggle_record": "CommandOrControl+Shift+R",
  "transcription_language": "fr",
  "auto_detect_language": false,
  "theme": "system",
  "minimize_to_tray": true,
  "auto_copy_to_clipboard": true,
  "notification_on_complete": true
}
```

**dictionary.json :**
```json
{
  "words": ["WakaScribe", "WakaStellar", "Parakeet"]
}
```

**history.json :**
```json
{
  "transcriptions": [
    {
      "text": "...",
      "confidence": 0.95,
      "duration_seconds": 5.2,
      "processing_time_ms": 450,
      "detected_language": "fr",
      "timestamp": 1706620800
    }
  ]
}
```

---

## 8. Gestion des erreurs

| Erreur | Cause | Comportement |
|--------|-------|--------------|
| `NoMicrophoneFound` | Aucun micro | Message + lien paramètres système |
| `MicrophoneAccessDenied` | Permission refusée | Guide autorisation |
| `ModelLoadFailed` | Modèle corrompu | Proposition réinstallation |
| `TranscriptionFailed` | Erreur OpenVINO | Retry puis erreur |
| `AudioTooShort` | < 0.5 seconde | "Enregistrement trop court" |

---

## 9. Hors périmètre MVP

- Authentification app.wakascribe.com
- Mode LLM/Groq (correction IA)
- Synchronisation cloud
- Support Windows
- Support Apple Silicon (MLX)
- TensorRT (NVIDIA)

Ces fonctionnalités sont prévues pour les phases suivantes.
