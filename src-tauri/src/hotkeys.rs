use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

/// Parse un raccourci clavier depuis un format string (ex: "Ctrl+Shift+R")
pub fn parse_hotkey(hotkey: &str) -> Option<Shortcut> {
    let parts: Vec<&str> = hotkey.split('+').collect();
    if parts.is_empty() {
        return None;
    }

    let mut modifiers = Modifiers::empty();
    let mut key_code: Option<Code> = None;

    for part in parts {
        let part_lower = part.trim().to_lowercase();
        match part_lower.as_str() {
            "ctrl" | "control" => modifiers |= Modifiers::CONTROL,
            "cmd" | "command" | "meta" => modifiers |= Modifiers::META,
            "commandorcontrol" => {
                #[cfg(target_os = "macos")]
                { modifiers |= Modifiers::META; }
                #[cfg(not(target_os = "macos"))]
                { modifiers |= Modifiers::CONTROL; }
            }
            "alt" | "option" => modifiers |= Modifiers::ALT,
            "shift" => modifiers |= Modifiers::SHIFT,
            _ => {
                key_code = match part.to_uppercase().as_str() {
                    "A" => Some(Code::KeyA),
                    "B" => Some(Code::KeyB),
                    "C" => Some(Code::KeyC),
                    "D" => Some(Code::KeyD),
                    "E" => Some(Code::KeyE),
                    "F" => Some(Code::KeyF),
                    "G" => Some(Code::KeyG),
                    "H" => Some(Code::KeyH),
                    "I" => Some(Code::KeyI),
                    "J" => Some(Code::KeyJ),
                    "K" => Some(Code::KeyK),
                    "L" => Some(Code::KeyL),
                    "M" => Some(Code::KeyM),
                    "N" => Some(Code::KeyN),
                    "O" => Some(Code::KeyO),
                    "P" => Some(Code::KeyP),
                    "Q" => Some(Code::KeyQ),
                    "R" => Some(Code::KeyR),
                    "S" => Some(Code::KeyS),
                    "T" => Some(Code::KeyT),
                    "U" => Some(Code::KeyU),
                    "V" => Some(Code::KeyV),
                    "W" => Some(Code::KeyW),
                    "X" => Some(Code::KeyX),
                    "Y" => Some(Code::KeyY),
                    "Z" => Some(Code::KeyZ),
                    "0" => Some(Code::Digit0),
                    "1" => Some(Code::Digit1),
                    "2" => Some(Code::Digit2),
                    "3" => Some(Code::Digit3),
                    "4" => Some(Code::Digit4),
                    "5" => Some(Code::Digit5),
                    "6" => Some(Code::Digit6),
                    "7" => Some(Code::Digit7),
                    "8" => Some(Code::Digit8),
                    "9" => Some(Code::Digit9),
                    "SPACE" => Some(Code::Space),
                    "ENTER" | "RETURN" => Some(Code::Enter),
                    "TAB" => Some(Code::Tab),
                    "ESCAPE" | "ESC" => Some(Code::Escape),
                    "BACKSPACE" => Some(Code::Backspace),
                    "DELETE" => Some(Code::Delete),
                    "F1" => Some(Code::F1),
                    "F2" => Some(Code::F2),
                    "F3" => Some(Code::F3),
                    "F4" => Some(Code::F4),
                    "F5" => Some(Code::F5),
                    "F6" => Some(Code::F6),
                    "F7" => Some(Code::F7),
                    "F8" => Some(Code::F8),
                    "F9" => Some(Code::F9),
                    "F10" => Some(Code::F10),
                    "F11" => Some(Code::F11),
                    "F12" => Some(Code::F12),
                    _ => None,
                };
            }
        }
    }

    key_code.map(|code| {
        if modifiers.is_empty() {
            Shortcut::new(None, code)
        } else {
            Shortcut::new(Some(modifiers), code)
        }
    })
}
