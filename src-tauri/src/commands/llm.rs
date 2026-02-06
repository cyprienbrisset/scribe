use std::sync::Arc;
use keyring::Entry;
use tauri::{Emitter, State};
use tokio::sync::RwLock;

use crate::engines::ModelManager;
use crate::llm::{groq_client, LocalLlmEngine};
use crate::storage::config;
use crate::types::{LlmProvider, LocalLlmModel};

const SERVICE_NAME: &str = "wakascribe";
const ACCOUNT_NAME: &str = "groq_api_key";

/// Stocke la clé API Groq dans les settings de l'application (et keyring en backup)
#[tauri::command]
pub fn set_groq_api_key(key: String) -> Result<(), String> {
    // Stocker dans les settings (méthode principale)
    let mut settings = config::load_settings();
    settings.groq_api_key = Some(key.clone());
    config::save_settings(&settings)?;

    // Essayer aussi le keyring en backup (mais ne pas échouer si ça marche pas)
    if let Ok(entry) = Entry::new(SERVICE_NAME, ACCOUNT_NAME) {
        let _ = entry.set_password(&key);
    }

    Ok(())
}

/// Récupère la clé API Groq (settings en priorité, puis keyring)
#[tauri::command]
pub fn get_groq_api_key() -> Option<String> {
    get_groq_api_key_internal()
}

/// Récupère la clé API Groq (usage interne sans attribut tauri::command)
/// Vérifie d'abord dans les settings, puis dans le keyring
pub fn get_groq_api_key_internal() -> Option<String> {
    // 1. Vérifier dans les settings
    let settings = config::load_settings();
    if let Some(ref key) = settings.groq_api_key {
        if !key.is_empty() {
            return Some(key.clone());
        }
    }

    // 2. Fallback sur le keyring
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME).ok()?;
    entry.get_password().ok()
}

/// Vérifie si une clé API Groq existe
#[tauri::command]
pub fn has_groq_api_key() -> bool {
    get_groq_api_key_internal().is_some()
}

/// Valide une clé API Groq en effectuant une requête de test à l'API
#[tauri::command]
pub async fn validate_groq_api_key(key: String) -> bool {
    // Envoie un message simple pour vérifier que la clé fonctionne
    match groq_client::send_completion(&key, "Reply with OK", "test").await {
        Ok(_) => {
            log::info!("Groq API key validated successfully");
            true
        }
        Err(groq_client::GroqError::InvalidApiKey) => {
            log::warn!("Groq API key is invalid (401 Unauthorized)");
            false
        }
        Err(groq_client::GroqError::RateLimit) => {
            // Rate limit signifie que la clé est valide mais on a trop de requêtes
            log::info!("Groq API key valid (rate limited)");
            true
        }
        Err(e) => {
            // Autres erreurs (réseau, timeout, etc.)
            // On considère la clé valide si c'est juste un problème réseau
            log::warn!("Groq API validation error: {}. Assuming key is valid.", e);
            true
        }
    }
}

/// Supprime la clé API Groq (des settings et du keyring)
#[tauri::command]
pub fn delete_groq_api_key() -> Result<(), String> {
    // Supprimer des settings
    let mut settings = config::load_settings();
    settings.groq_api_key = None;
    config::save_settings(&settings)?;

    // Essayer de supprimer du keyring aussi
    if let Ok(entry) = Entry::new(SERVICE_NAME, ACCOUNT_NAME) {
        let _ = entry.delete_credential();
    }

    Ok(())
}

/// Récupère les informations de quota Groq
#[tauri::command]
pub fn get_groq_quota() -> Option<groq_client::GroqQuota> {
    groq_client::get_last_quota()
}

/// Résume un texte transcrit via Groq
#[tauri::command]
pub async fn summarize_text(text: String) -> Result<String, String> {
    let api_key = get_groq_api_key_internal()
        .ok_or_else(|| "Clé API Groq non configurée. Configurez-la dans les paramètres.".to_string())?;

    let system_prompt = r#"Tu es un assistant expert en analyse de transcriptions audio.

Tu vas recevoir une transcription brute issue d'un enregistrement audio
(appel, réunion, note vocale, réflexion personnelle, brainstorm, etc.).
La transcription peut contenir :
- des hésitations, répétitions, fautes,
- des phrases incomplètes,
- plusieurs interlocuteurs non identifiés,
- des digressions ou du bruit conversationnel.

🎯 Ton objectif :
Produire un résumé clair, structuré et fidèle au contenu réel,
sans inventer d'informations.

🧠 Étapes à suivre :

1. Comprendre le contexte implicite
   - Identifier s'il s'agit plutôt d'un appel, d'une réunion, d'une réflexion personnelle, etc.
   - Déduire l'intention principale (décision, partage d'info, idée, problème, action).

2. Nettoyer mentalement la transcription
   - Ignorer les hésitations, répétitions et parasites oraux.
   - Reformuler de manière fluide sans trahir le sens.

3. Produire le résumé selon la structure suivante :

## Résumé
Un paragraphe qui explique l'essentiel
comme si tu racontais à quelqu'un qui n'a pas écouté l'audio.

### 🔑 Points clés
- Liste à puces des idées importantes
- Une idée = une puce
- Pas de remplissage

### ✅ Décisions / Conclusions (si applicable)
- Ce qui est acté ou clairement conclu
- Si aucune décision : écrire "Aucune décision formelle"

### 📌 Actions / Sujets à suivre (si applicable)
- Actions explicites ou implicites
- Qui fait quoi si identifiable
- Sinon : "Aucune action clairement définie"

4. Adapter automatiquement le ton
   - Professionnel si contexte pro
   - Neutre si réflexion personnelle
   - Clair et factuel dans tous les cas

🚫 Contraintes importantes :
- Ne jamais inventer d'éléments absents de la transcription
- Ne pas interpréter psychologiquement les personnes
- Ne pas résumer mot à mot : reformuler intelligemment
- Rester concis mais complet"#;

    let user_message = format!("Voici la transcription à analyser :\n\n{}", text);

    match groq_client::send_completion(&api_key, system_prompt, &user_message).await {
        Ok(summary) => {
            log::info!("Summarization successful: {} chars -> {} chars", text.len(), summary.len());
            Ok(summary.trim().to_string())
        }
        Err(e) => {
            log::error!("Summarization failed: {}", e);
            Err(format!("Échec du résumé: {}", e))
        }
    }
}

/// Traduit un texte vers une langue cible via Groq
#[tauri::command]
pub async fn translate_text(text: String, target_language: String) -> Result<String, String> {
    let api_key = get_groq_api_key_internal()
        .ok_or_else(|| "No Groq API key configured".to_string())?;

    let language_name = match target_language.as_str() {
        "fr" => "French",
        "en" => "English",
        "de" => "German",
        "es" => "Spanish",
        "it" => "Italian",
        "pt" => "Portuguese",
        "nl" => "Dutch",
        "ru" => "Russian",
        "zh" => "Chinese",
        "ja" => "Japanese",
        "ko" => "Korean",
        "ar" => "Arabic",
        _ => &target_language,
    };

    let system_prompt = format!(
        "You are a professional translator. Translate the following text to {}. \
         Only output the translation, nothing else. Preserve the original formatting, \
         punctuation and tone. If the text is already in {}, return it unchanged.",
        language_name, language_name
    );

    match groq_client::send_completion(&api_key, &system_prompt, &text).await {
        Ok(translated) => {
            log::info!("Translation successful: {} -> {}", text.len(), translated.len());
            Ok(translated.trim().to_string())
        }
        Err(e) => {
            log::error!("Translation failed: {}", e);
            Err(format!("Translation failed: {}", e))
        }
    }
}

// === LLM LOCAL (MISTRAL) ===

/// Vérifie si un modèle LLM local est disponible
#[tauri::command]
pub fn is_llm_model_available(
    model_manager: State<'_, Arc<ModelManager>>,
    model_size: LocalLlmModel,
) -> bool {
    model_manager.is_llm_model_available(model_size)
}

/// Liste les modèles LLM disponibles
#[tauri::command]
pub fn get_available_llm_models(
    model_manager: State<'_, Arc<ModelManager>>,
) -> Vec<LocalLlmModel> {
    model_manager.available_llm_models()
}

/// Télécharge un modèle LLM
#[tauri::command]
pub async fn download_llm_model(
    app: tauri::AppHandle,
    model_manager: State<'_, Arc<ModelManager>>,
    model_size: LocalLlmModel,
) -> Result<String, String> {
    log::info!("download_llm_model called with model_size: {:?}", model_size);
    println!("[LLM] download_llm_model called with model_size: {:?}", model_size);

    let manager = model_manager.inner().clone();
    let app_clone = app.clone();

    let result = manager
        .download_llm_model(model_size, move |downloaded, total| {
            let progress = (downloaded as f64 / total as f64 * 100.0) as u32;
            if downloaded % (10 * 1024 * 1024) < 1024 * 1024 {
                println!("[LLM] Download progress: {}% ({}/{})", progress, downloaded, total);
            }
            let _ = app_clone.emit("llm-download-progress", serde_json::json!({
                "model": model_size,
                "downloaded": downloaded,
                "total": total,
                "progress": progress
            }));
        })
        .await;

    match &result {
        Ok(path) => {
            log::info!("LLM model downloaded successfully to: {:?}", path);
            println!("[LLM] Model downloaded successfully to: {:?}", path);
        }
        Err(e) => {
            log::error!("LLM model download failed: {}", e);
            println!("[LLM] Download failed: {}", e);
        }
    }

    result.map(|path| path.to_string_lossy().to_string())
}

/// Supprime un modèle LLM
#[tauri::command]
pub async fn delete_llm_model(
    model_manager: State<'_, Arc<ModelManager>>,
    model_size: LocalLlmModel,
) -> Result<(), String> {
    model_manager.delete_llm_model(model_size).await
}

/// Résume un texte avec le modèle local Mistral
#[tauri::command]
pub async fn summarize_text_local(
    model_manager: State<'_, Arc<ModelManager>>,
    llm_engine: State<'_, Arc<RwLock<Option<LocalLlmEngine>>>>,
    text: String,
) -> Result<String, String> {
    let settings = config::load_settings();

    // Vérifier que le modèle est disponible
    let model_path = model_manager
        .get_llm_model_path(settings.local_llm_model)
        .ok_or_else(|| format!(
            "Modèle LLM {} non installé. Téléchargez-le dans les paramètres.",
            settings.local_llm_model.display_name()
        ))?;

    // Charger le moteur si nécessaire
    {
        let engine_read = llm_engine.read().await;
        if engine_read.is_none() {
            drop(engine_read);
            let mut engine_write = llm_engine.write().await;
            if engine_write.is_none() {
                log::info!("Initializing Local LLM engine...");
                let engine = LocalLlmEngine::new(&model_path, settings.local_llm_model)?;
                *engine_write = Some(engine);
            }
        }
    }

    // Effectuer le résumé
    let engine_read = llm_engine.read().await;
    let engine = engine_read.as_ref().ok_or("LLM engine not initialized")?;

    log::info!("Summarizing {} chars with local LLM", text.len());
    let summary = engine.summarize(&text)?;
    log::info!("Local summarization complete: {} chars", summary.len());

    Ok(summary)
}

/// Résume un texte avec le provider configuré (auto-sélection local/cloud)
#[tauri::command]
pub async fn summarize_text_smart(
    model_manager: State<'_, Arc<ModelManager>>,
    llm_engine: State<'_, Arc<RwLock<Option<LocalLlmEngine>>>>,
    text: String,
    provider: Option<LlmProvider>,
) -> Result<String, String> {
    let settings = config::load_settings();
    let use_provider = provider.unwrap_or(settings.llm_provider);

    match use_provider {
        LlmProvider::Local => {
            summarize_text_local(model_manager, llm_engine, text).await
        }
        LlmProvider::Groq => {
            summarize_text(text).await
        }
    }
}
