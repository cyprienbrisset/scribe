/// Resample l'audio en utilisant rubato (haute qualité sinc interpolation)
pub fn resample_audio(input: &[f32], from_rate: u32, to_rate: u32) -> Vec<f32> {
    if from_rate == to_rate || input.is_empty() {
        return input.to_vec();
    }

    use rubato::{
        Resampler, SincFixedIn, SincInterpolationParameters, SincInterpolationType, WindowFunction,
    };

    let params = SincInterpolationParameters {
        sinc_len: 64,
        f_cutoff: 0.95,
        interpolation: SincInterpolationType::Linear,
        oversampling_factor: 8,
        window: WindowFunction::BlackmanHarris2,
    };

    match SincFixedIn::<f32>::new(
        to_rate as f64 / from_rate as f64,
        2.0,
        params,
        input.len(),
        1,
    ) {
        Ok(mut resampler) => {
            let waves_in = vec![input.to_vec()];
            match resampler.process(&waves_in, None) {
                Ok(waves_out) => waves_out.into_iter().next().unwrap_or_default(),
                Err(e) => {
                    log::error!("Resample error: {}", e);
                    input.to_vec()
                }
            }
        }
        Err(e) => {
            log::error!("Failed to create resampler: {}", e);
            input.to_vec()
        }
    }
}
