use keyring::Entry;

use crate::llm::groq_client;

const SERVICE_NAME: &str = "wakascribe";
const ACCOUNT_NAME: &str = "groq_api_key";

/// Stocke la clé API Groq dans le keyring sécurisé du système
#[tauri::command]
pub fn set_groq_api_key(key: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;

    entry
        .set_password(&key)
        .map_err(|e| format!("Failed to store API key: {}", e))
}

/// Récupère la clé API Groq depuis le keyring (pour validation interne)
#[tauri::command]
pub fn get_groq_api_key() -> Option<String> {
    get_groq_api_key_internal()
}

/// Récupère la clé API Groq depuis le keyring (usage interne sans attribut tauri::command)
pub fn get_groq_api_key_internal() -> Option<String> {
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME).ok()?;
    entry.get_password().ok()
}

/// Vérifie si une clé API Groq existe dans le keyring
#[tauri::command]
pub fn has_groq_api_key() -> bool {
    let entry = match Entry::new(SERVICE_NAME, ACCOUNT_NAME) {
        Ok(e) => e,
        Err(_) => return false,
    };

    entry.get_password().is_ok()
}

/// Valide une clé API Groq en effectuant une requête de test à l'API
#[tauri::command]
pub async fn validate_groq_api_key(key: String) -> bool {
    // Envoie un message simple pour vérifier que la clé fonctionne
    match groq_client::send_completion(&key, "", "test").await {
        Ok(_) => true,
        Err(groq_client::GroqError::InvalidApiKey) => false,
        Err(groq_client::GroqError::RateLimit) => {
            // Rate limit signifie que la clé est valide mais on a trop de requêtes
            true
        }
        Err(_) => {
            // Autres erreurs (réseau, timeout, etc.) - on ne peut pas confirmer
            // On retourne false par précaution
            false
        }
    }
}

/// Supprime la clé API Groq du keyring
#[tauri::command]
pub fn delete_groq_api_key() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, ACCOUNT_NAME)
        .map_err(|e| format!("Failed to access keyring entry: {}", e))?;

    entry
        .delete_credential()
        .map_err(|e| format!("Failed to delete API key: {}", e))
}
