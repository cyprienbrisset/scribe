//! Voice command action executor

use super::Action;
use crate::platform;

/// Execute a list of voice command actions
pub fn execute_actions(actions: &[Action]) {
    for action in actions {
        execute_action(action);
    }
}

fn execute_action(action: &Action) {
    match action {
        Action::OpenApp(app_name) => {
            platform::open_app(app_name);
        }
        // Other actions are handled by the frontend or not yet implemented
        _ => {
            log::debug!("Action {:?} not executed server-side", action);
        }
    }
}
