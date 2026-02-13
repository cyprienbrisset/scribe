use crate::platform;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn send_to_apple_notes(title: String, body: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        platform::apple_notes_create(&title, &body)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (title, body);
        Err("Apple Notes is only available on macOS".to_string())
    }
}

#[tauri::command]
pub fn send_to_obsidian(state: State<'_, AppState>, title: String, body: String) -> Result<(), String> {
    let settings = state.settings.read().map_err(|e| e.to_string())?;
    let vault_path = settings.integrations.obsidian_vault_path.clone()
        .ok_or_else(|| "Obsidian vault path not configured".to_string())?;
    drop(settings);
    platform::obsidian_create(&vault_path, &title, &body)
}
