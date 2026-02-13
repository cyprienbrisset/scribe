use crate::types::{DailyStats, UsageStats};
use std::fs;
use std::path::PathBuf;

fn stats_path() -> PathBuf {
    super::get_app_data_dir().join("stats.json")
}

pub fn load_stats() -> UsageStats {
    let path = stats_path();
    if path.exists() {
        let content = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        UsageStats::default()
    }
}

pub fn save_stats(stats: &UsageStats) -> Result<(), String> {
    super::ensure_app_data_dir().map_err(|e| e.to_string())?;
    let path = stats_path();
    let content = serde_json::to_string_pretty(stats).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn record_transcription(word_count: u64, duration_secs: f64, language: Option<&str>) -> Result<(), String> {
    let mut stats = load_stats();

    // Update totals
    stats.total_words += word_count;
    stats.total_transcriptions += 1;
    stats.total_duration_secs += duration_secs;

    // Update daily stats
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let daily = stats.daily_stats.entry(today).or_insert_with(DailyStats::default);
    daily.words += word_count;
    daily.transcriptions += 1;
    daily.duration_secs += duration_secs;

    // Update language stats
    if let Some(lang) = language {
        let count = stats.languages_used.entry(lang.to_string()).or_insert(0);
        *count += 1;
    }

    save_stats(&stats)
}
