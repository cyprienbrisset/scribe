use crate::storage::snippets;
use crate::types::Snippet;

#[tauri::command]
pub fn get_snippets() -> Result<Vec<Snippet>, String> {
    Ok(snippets::load_snippets().snippets)
}

#[tauri::command]
pub fn add_snippet(snippet: Snippet) -> Result<(), String> {
    snippets::add_snippet(snippet)
}

#[tauri::command]
pub fn update_snippet(id: String, snippet: Snippet) -> Result<(), String> {
    snippets::update_snippet(&id, snippet)
}

#[tauri::command]
pub fn remove_snippet(id: String) -> Result<(), String> {
    snippets::remove_snippet(&id)
}
