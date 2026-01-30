# Intégration OpenVINO Parakeet - Document de Design

**Date:** 30 janvier 2026
**Statut:** Validé

---

## 1. Objectif

Remplacer le mock STT par une vraie transcription vocale utilisant le modèle [Parakeet-TDT-0.6b-v3-ov](https://huggingface.co/FluidInference/parakeet-tdt-0.6b-v3-ov) via OpenVINO, le tout embarqué dans l'application.

## 2. Architecture

```
┌─────────────────────────────────────────────────────┐
│           WakaScribe (Tauri Commands)               │
│  start_recording() → stop_recording() → transcribe  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              OpenVINO Engine (Rust)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ MelSpectro  │→│   Encoder   │→│Decoder+Joint │  │
│  │   Model     │ │    Model    │ │   (loop)     │  │
│  └─────────────┘ └─────────────┘ └──────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│        OpenVINO Runtime (embarqué dans app)         │
└─────────────────────────────────────────────────────┘
```

## 3. Modèles Parakeet

| Fichier | Taille | Rôle |
|---------|--------|------|
| parakeet_melspectogram.xml/.bin | 477 KB | Audio → Mel features |
| parakeet_encoder.xml/.bin | 1.19 GB | Mel → Encoder output |
| parakeet_decoder.xml/.bin | 23.6 MB | Prediction network |
| parakeet_joint.xml/.bin | 12.6 MB | Joint network |
| parakeet_v3_vocab.json | 159 KB | Token → Texte |

**Total : ~1.23 GB**

## 4. Pipeline d'inférence

### Étape 1 : Prétraitement audio
```
Audio brut (f32, 16kHz) → Normalisation → Tensor [1, samples]
```

### Étape 2 : Mel Spectrogram
```
Input:  [1, audio_samples]
Output: [1, 80, time_frames]
```

### Étape 3 : Encoder
```
Input:  [1, 80, T]
Output: [1, T', hidden_dim]  (T' = T/8 downsampling)
```

### Étape 4 : Décodage TDT (boucle greedy)
```rust
t = 0
tokens = []
decoder_state = initial_state

while t < encoder_length:
    decoder_out = decoder.infer(last_token, decoder_state)
    logits = joint.infer(encoder_out[t], decoder_out)
    token = argmax(logits)

    if token == BLANK_TOKEN:
        t += 1  // Avancer d'un frame
    else:
        tokens.push(token)
        // TDT: peut sauter plusieurs frames
```

### Étape 5 : Décodage texte
```
Token IDs → Vocabulary lookup → Texte UTF-8
```

## 5. Structure des fichiers

```
src-tauri/
├── resources/
│   ├── openvino/
│   │   ├── libopenvino.dylib
│   │   ├── libopenvino_c.dylib
│   │   ├── libopenvino_intel_cpu_plugin.dylib
│   │   └── plugins.xml
│   └── models/
│       ├── parakeet_melspectogram.xml
│       ├── parakeet_melspectogram.bin
│       ├── parakeet_encoder.xml
│       ├── parakeet_encoder.bin
│       ├── parakeet_decoder.xml
│       ├── parakeet_decoder.bin
│       ├── parakeet_joint.xml
│       ├── parakeet_joint.bin
│       └── parakeet_v3_vocab.json
├── src/
│   └── engines/
│       ├── mod.rs
│       ├── traits.rs
│       ├── openvino.rs      # Implémentation principale
│       ├── vocabulary.rs    # Décodage tokens
│       └── error.rs         # Types d'erreurs
```

## 6. Configuration Tauri

```json
{
  "bundle": {
    "resources": [
      "resources/openvino/*",
      "resources/models/*"
    ]
  }
}
```

## 7. Dépendances Cargo

```toml
openvino = "0.9"
```

## 8. Gestion d'erreurs

```rust
pub enum EngineError {
    OpenVINOInitFailed(String),
    ModelLoadFailed(String),
    InferenceError(String),
    AudioTooShort,
    InvalidSampleRate(u32),
}
```

## 9. Intégration state.rs

```rust
pub struct AppState {
    pub is_recording: Arc<RwLock<bool>>,
    pub settings: Arc<RwLock<AppSettings>>,
    pub engine: Arc<OpenVINOEngine>,  // Chargé au démarrage
}
```

## 10. Performances attendues

| Métrique | Valeur |
|----------|--------|
| Latence (10s audio) | 2-3s sur CPU Intel |
| RTFx | 3-5x temps réel |
| RAM | ~2GB pendant inférence |
| Taille app | ~1.4GB |

## 11. Langues supportées

24 langues européennes dont : Français, Anglais, Allemand, Espagnol, Italien, etc.

Détection automatique de la langue.
