use crate::types::{Snippet, SnippetsData};
use std::fs;
use std::path::PathBuf;

fn snippets_path() -> PathBuf {
    super::get_app_data_dir().join("snippets.json")
}

pub fn load_snippets() -> SnippetsData {
    let path = snippets_path();
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        SnippetsData::default()
    }
}

pub fn save_snippets(data: &SnippetsData) -> Result<(), String> {
    super::ensure_app_data_dir().map_err(|e| e.to_string())?;
    let path = snippets_path();
    let content = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn add_snippet(snippet: Snippet) -> Result<(), String> {
    let mut data = load_snippets();
    data.snippets.push(snippet);
    save_snippets(&data)
}

pub fn update_snippet(id: &str, snippet: Snippet) -> Result<(), String> {
    let mut data = load_snippets();
    if let Some(existing) = data.snippets.iter_mut().find(|s| s.id == id) {
        *existing = snippet;
        save_snippets(&data)
    } else {
        Err("Snippet not found".to_string())
    }
}

pub fn remove_snippet(id: &str) -> Result<(), String> {
    let mut data = load_snippets();
    data.snippets.retain(|s| s.id != id);
    save_snippets(&data)
}
