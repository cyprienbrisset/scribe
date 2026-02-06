use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, Host, Stream, StreamConfig};
use std::sync::{Arc, Mutex};

use crate::types::AudioDevice;

/// Limite du buffer audio : 10 minutes à 48kHz mono
const MAX_BUFFER_SAMPLES: usize = 48000 * 60 * 10;

pub struct AudioCapture {
    stream: Option<Stream>,
    buffer: Arc<Mutex<Vec<f32>>>,
    sample_rate: u32,
    channels: u16,
}

impl AudioCapture {
    pub fn list_devices() -> Result<Vec<AudioDevice>, String> {
        let host = cpal::default_host();
        let default_device = host.default_input_device();
        let default_name = default_device.and_then(|d| d.name().ok());

        let devices: Vec<AudioDevice> = host
            .input_devices()
            .map_err(|e| e.to_string())?
            .filter_map(|device| {
                let name = device.name().ok()?;
                Some(AudioDevice {
                    id: name.clone(),
                    name: name.clone(),
                    is_default: Some(&name) == default_name.as_ref(),
                })
            })
            .collect();

        Ok(devices)
    }

    pub fn new(device_id: Option<&str>) -> Result<Self, String> {
        let host = cpal::default_host();
        let device = Self::get_device(&host, device_id)?;
        let config = device.default_input_config().map_err(|e| e.to_string())?;

        Ok(Self {
            stream: None,
            buffer: Arc::new(Mutex::new(Vec::new())),
            sample_rate: config.sample_rate().0,
            channels: config.channels(),
        })
    }

    fn get_device(host: &Host, device_id: Option<&str>) -> Result<Device, String> {
        match device_id {
            Some(id) => host
                .input_devices()
                .map_err(|e| e.to_string())?
                .find(|d| d.name().ok().as_deref() == Some(id))
                .ok_or_else(|| format!("Device '{}' not found", id)),
            None => host
                .default_input_device()
                .ok_or_else(|| "No default input device".to_string()),
        }
    }

    pub fn start(&mut self, device_id: Option<&str>) -> Result<(), String> {
        let host = cpal::default_host();
        let device = Self::get_device(&host, device_id)?;
        let config = device.default_input_config().map_err(|e| e.to_string())?;

        self.sample_rate = config.sample_rate().0;
        self.channels = config.channels();
        if let Ok(mut buf) = self.buffer.lock() {
            buf.clear();
        }

        let buffer = self.buffer.clone();
        let channels = self.channels as usize;
        let config: StreamConfig = config.into();

        log::info!("Starting audio capture: {}Hz, {} channel(s)", self.sample_rate, channels);

        let stream = device
            .build_input_stream(
                &config,
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if let Ok(mut buf) = buffer.lock() {
                        if buf.len() >= MAX_BUFFER_SAMPLES {
                            return;
                        }
                        // Convertir stéréo → mono si nécessaire
                        if channels > 1 {
                            for chunk in data.chunks(channels) {
                                let mono: f32 = chunk.iter().sum::<f32>() / channels as f32;
                                buf.push(mono);
                            }
                        } else {
                            buf.extend_from_slice(data);
                        }
                    }
                },
                |err| {
                    log::error!("Audio stream error: {}", err);
                },
                None,
            )
            .map_err(|e| e.to_string())?;

        stream.play().map_err(|e| e.to_string())?;
        self.stream = Some(stream);

        Ok(())
    }

    pub fn stop(&mut self) -> Result<(Vec<f32>, u32), String> {
        self.stream = None;
        let buffer = self.buffer.lock()
            .map_err(|e| format!("Failed to lock audio buffer: {}", e))?
            .clone();
        let sample_rate = self.sample_rate;
        if let Ok(mut buf) = self.buffer.lock() {
            buf.clear();
        }
        Ok((buffer, sample_rate))
    }

    pub fn is_recording(&self) -> bool {
        self.stream.is_some()
    }

    pub fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    /// Retourne un snapshot de l'audio accumulé sans arrêter l'enregistrement
    pub fn get_audio_snapshot(&self) -> (Vec<f32>, u32) {
        let buffer = self.buffer.lock()
            .map(|buf| buf.clone())
            .unwrap_or_default();
        (buffer, self.sample_rate)
    }
}
