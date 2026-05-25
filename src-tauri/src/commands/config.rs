//! Configuration-related Tauri commands

use serde::Deserialize;
use tauri::State;

use crate::config::{Config, ConfigManager, ProxyProfile};

#[derive(Debug, Deserialize)]
pub struct CreateProfileInput {
    pub name: String,
    pub local_port: u16,
    pub target_base_url: String,
    pub max_retries: u32,
    pub retry_delay_ms: u64,
    pub retry_status_codes: Vec<u16>,
    pub first_byte_timeout_ms: u64,
    pub full_response_timeout_ms: u64,
    pub stream_idle_timeout_ms: u64,
}

/// Get current configuration
#[tauri::command]
pub fn get_config(manager: State<'_, ConfigManager>) -> Config {
    manager.get_config()
}

/// Save configuration
#[tauri::command]
pub fn save_config(manager: State<'_, ConfigManager>, config: Config) -> Result<(), String> {
    manager.save_config(&config).map_err(|e| e.to_string())
}

/// Create a new profile
#[tauri::command]
pub fn create_profile(
    manager: State<'_, ConfigManager>,
    profile: CreateProfileInput,
) -> Result<ProxyProfile, String> {
    manager
        .create_profile(ProxyProfile {
            id: String::new(),
            name: profile.name,
            local_port: profile.local_port,
            target_base_url: profile.target_base_url,
            max_retries: profile.max_retries,
            retry_delay_ms: profile.retry_delay_ms,
            retry_status_codes: profile.retry_status_codes,
            first_byte_timeout_ms: profile.first_byte_timeout_ms,
            full_response_timeout_ms: profile.full_response_timeout_ms,
            stream_idle_timeout_ms: profile.stream_idle_timeout_ms,
        })
        .map_err(|e| e.to_string())
}

/// Update a profile
#[tauri::command]
pub fn update_profile(
    manager: State<'_, ConfigManager>,
    profile: ProxyProfile,
) -> Result<(), String> {
    manager.update_profile(profile).map_err(|e| e.to_string())
}

/// Delete a profile
#[tauri::command]
pub fn delete_profile(manager: State<'_, ConfigManager>, id: String) -> Result<(), String> {
    manager.delete_profile(&id).map_err(|e| e.to_string())
}

/// Set active profile
#[tauri::command]
pub fn set_active_profile(manager: State<'_, ConfigManager>, id: String) -> Result<(), String> {
    manager.set_active_profile(&id).map_err(|e| e.to_string())
}
