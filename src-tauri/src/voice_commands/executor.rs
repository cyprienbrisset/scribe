//! Voice command action executor

use super::Action;
use crate::platform;
use crate::types::Snippet;

/// Execute a list of voice command actions
pub fn execute_actions(actions: &[Action], snippets: &[Snippet]) {
    for action in actions {
        execute_action(action, snippets);
    }
}

fn execute_action(action: &Action, snippets: &[Snippet]) {
    match action {
        Action::OpenApp(app_name) => {
            platform::open_app(app_name);
        }
        Action::InsertSnippet(trigger) => {
            if let Some(s) = snippets.iter().find(|s| s.trigger == *trigger) {
                platform::paste_text(&s.content);
            }
        }
        Action::SetVolume(level) => {
            platform::set_volume(*level);
        }
        Action::ToggleDND => {
            platform::toggle_dnd();
        }
        Action::Screenshot => {
            platform::take_screenshot();
        }
        Action::LockScreen => {
            platform::lock_screen();
        }
        Action::FormatBold => {
            platform::send_keyboard_shortcut("b");
        }
        Action::FormatItalic => {
            platform::send_keyboard_shortcut("i");
        }
        Action::FormatUnderline => {
            platform::send_keyboard_shortcut("u");
        }
        // Other actions are handled by the frontend or not yet implemented
        _ => {
            log::debug!("Action {:?} not executed server-side", action);
        }
    }
}
