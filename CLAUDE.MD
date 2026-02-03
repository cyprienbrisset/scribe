# CLAUDE.MD - WakaScribe

## Vue d'ensemble du projet

WakaScribe est une application de dictée vocale cross-platform (macOS/Windows) fonctionnant en mode local sans connexion Internet. Elle utilise Whisper.cpp pour la reconnaissance vocale.

**Propriétaire:** Cyprien BRISSET
**Distribution:** Freeware gratuit (Site WakaStellar, App Store, Microsoft Store)

## Stack technique

```
Frontend: React 18 + TypeScript + TailwindCSS + Zustand
Backend:  Rust/Tauri 2.x + cpal + reqwest + keyring
Moteurs:  Whisper.cpp via whisper-rs
```

## Structure du projet

```
wakascribe/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                    # Point d'entrée Tauri
│   │   ├── commands/                  # Commandes Tauri
│   │   │   ├── transcription.rs
│   │   │   ├── audio.rs
│   │   │   ├── auth.rs
│   │   │   └── settings.rs
│   │   ├── engines/                   # Moteur STT
│   │   │   ├── whisper.rs
│   │   │   ├── model_manager.rs
│   │   │   ├── traits.rs
│   │   │   └── error.rs
│   │   ├── audio/                     # Capture audio
│   │   │   ├── capture.rs
│   │   │   ├── buffer.rs
│   │   │   └── vad.rs
│   │   ├── api/                       # Client API
│   │   │   ├── client.rs
│   │   │   ├── auth.rs
│   │   │   └── sync.rs
│   │   └── storage/                   # Stockage local
│   │       ├── config.rs
│   │       └── dictionary.rs
│   ├── binaries/                      # Sidecars STT
│   └── models/                        # Modèles Parakeet
├── src/
│   ├── components/
│   │   ├── dictation/
│   │   ├── settings/
│   │   └── auth/
│   ├── stores/
│   │   ├── transcriptionStore.ts
│   │   ├── settingsStore.ts
│   │   └── authStore.ts
│   ├── hooks/
│   └── types/
├── package.json
└── PRD.MD
```

## Commandes de développement

```bash
# Installation des dépendances
npm install

# Développement
npm run tauri dev

# Build production
npm run tauri build

# Tests Rust
cd src-tauri && cargo test

# Tests frontend
npm test

# Linting
npm run lint
cargo clippy
```

## Architecture du moteur STT

WakaScribe utilise Whisper.cpp via les bindings whisper-rs pour la reconnaissance vocale:

| Modèle   | Taille   | Qualité    | Disponibilité  |
|----------|----------|------------|----------------|
| Tiny     | 75 MB    | Basique    | Bundlé         |
| Small    | 466 MB   | Bonne      | Téléchargeable |
| Medium   | 1.5 GB   | Très bonne | Téléchargeable |

- **Tiny** est inclus dans l'application par défaut
- Les modèles Small et Medium peuvent être téléchargés depuis les paramètres
- Support de 99 langues avec détection automatique

## Conventions de code

### Rust (src-tauri/)

- Utiliser `#[tauri::command]` pour les commandes exposées au frontend
- Structures sérialisables avec `#[derive(Serialize, Deserialize)]`
- Gestion d'erreurs avec `Result<T, String>` pour les commandes Tauri
- État partagé via `Arc<RwLock<T>>` dans `AppState`
- Tokens d'authentification stockés avec `keyring`

### TypeScript/React (src/)

- Stores Zustand dans `src/stores/`
- Communication backend via `invoke()` de `@tauri-apps/api/core`
- Types partagés dans `src/types/`
- Composants fonctionnels avec hooks
- TailwindCSS pour le styling

## API Backend

**Base URL:** `https://app.wakascribe.com/api/v1`

Endpoints principaux :
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Rafraîchissement token

**LLM (Groq):** `https://api.groq.com/openai/v1/chat/completions`
- Modèle: `llama-3.1-70b-versatile`

## Hotkeys par défaut

- **Push-to-talk:** `CommandOrControl+Shift+Space`
- **Toggle record:** `CommandOrControl+Shift+R`

## Plugins Tauri requis

- `tauri-plugin-shell` (sidecars)
- `tauri-plugin-global-shortcut` (hotkeys)
- `tauri-plugin-notification`
- `tauri-plugin-clipboard-manager`
- `tauri-plugin-updater`

## Ressources externes

- **Modèles:** ggerganov/whisper.cpp (Hugging Face)
- **Docs Tauri:** https://v2.tauri.app
- **Docs Whisper.cpp:** https://github.com/ggerganov/whisper.cpp

## Points d'attention

1. **Mode offline obligatoire** - La transcription doit fonctionner sans connexion
2. **Sélection automatique du moteur** - Selon le hardware détecté
3. **Sécurité des tokens** - Utiliser `keyring` pour le stockage sécurisé
4. **Performance** - Cibler <200ms de latence sur Apple Silicon
5. **Historique** - Limité à 50 entrées en mémoire
