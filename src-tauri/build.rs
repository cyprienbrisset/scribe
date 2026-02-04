use std::env;
use std::fs;
use std::path::PathBuf;
use std::process::Command;

fn main() {
    // Setup Vosk library for macOS
    setup_vosk();

    tauri_build::build()
}

fn setup_vosk() {
    let target = env::var("TARGET").unwrap_or_default();
    let out_dir = env::var("OUT_DIR").unwrap();
    let vosk_dir = PathBuf::from(&out_dir).join("vosk");

    // Only for macOS
    if !target.contains("apple") && !target.contains("darwin") {
        println!("cargo:warning=Vosk setup: Skipping non-macOS target");
        return;
    }

    let lib_path = vosk_dir.join("libvosk.dylib");

    // Check if already downloaded
    if lib_path.exists() {
        println!("cargo:rustc-link-search=native={}", vosk_dir.display());
        println!("cargo:rustc-link-lib=dylib=vosk");
        return;
    }

    println!("cargo:warning=Downloading Vosk library for macOS...");

    // Create directory
    fs::create_dir_all(&vosk_dir).expect("Failed to create vosk directory");

    let zip_path = vosk_dir.join("vosk-osx.zip");
    let url = "https://github.com/alphacep/vosk-api/releases/download/v0.3.42/vosk-osx-0.3.42.zip";

    // Download using curl
    let status = Command::new("curl")
        .args(["-L", "-o", zip_path.to_str().unwrap(), url])
        .status()
        .expect("Failed to download Vosk");

    if !status.success() {
        panic!("Failed to download Vosk library");
    }

    // Extract using unzip
    let status = Command::new("unzip")
        .args(["-o", zip_path.to_str().unwrap(), "-d", vosk_dir.to_str().unwrap()])
        .status()
        .expect("Failed to extract Vosk");

    if !status.success() {
        panic!("Failed to extract Vosk library");
    }

    // Move library from extracted folder
    let extracted_dir = vosk_dir.join("vosk-osx-0.3.42");
    if extracted_dir.exists() {
        for entry in fs::read_dir(&extracted_dir).expect("Failed to read extracted dir") {
            let entry = entry.expect("Failed to read entry");
            let path = entry.path();
            let dest = vosk_dir.join(path.file_name().unwrap());
            fs::rename(&path, &dest).expect("Failed to move file");
        }
        fs::remove_dir_all(&extracted_dir).ok();
    }

    // Fix install_name for runtime loading
    let _ = Command::new("install_name_tool")
        .args(["-id", "@executable_path/libvosk.dylib", lib_path.to_str().unwrap()])
        .status();

    // Clean up zip
    fs::remove_file(&zip_path).ok();

    // Copy to target directories for runtime access
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    for target_dir in ["debug", "release"] {
        let dest_dir = PathBuf::from(&manifest_dir).join("target").join(target_dir);
        fs::create_dir_all(&dest_dir).ok();
        let dest_lib = dest_dir.join("libvosk.dylib");
        if !dest_lib.exists() {
            if fs::copy(&lib_path, &dest_lib).is_ok() {
                // Fix install_name on the copied file too
                let _ = Command::new("install_name_tool")
                    .args(["-id", "@executable_path/libvosk.dylib", dest_lib.to_str().unwrap()])
                    .status();
            }
        }
    }

    println!("cargo:warning=Vosk library downloaded successfully");
    println!("cargo:rustc-link-search=native={}", vosk_dir.display());
    println!("cargo:rustc-link-lib=dylib=vosk");
}
