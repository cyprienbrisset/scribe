use crate::storage::stats;
use crate::types::UsageStats;

#[tauri::command]
pub fn get_usage_stats() -> Result<UsageStats, String> {
    Ok(stats::load_stats())
}

#[tauri::command]
pub fn reset_stats() -> Result<(), String> {
    stats::save_stats(&UsageStats::default())
}
