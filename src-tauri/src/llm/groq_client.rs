use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

const GROQ_API_ENDPOINT: &str = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL: &str = "llama-3.1-70b-versatile";
const TIMEOUT_SECONDS: u64 = 5;

#[derive(Debug)]
pub enum GroqError {
    InvalidApiKey,
    RateLimit,
    Timeout,
    NetworkError(String),
    ParseError(String),
}

impl std::fmt::Display for GroqError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GroqError::InvalidApiKey => write!(f, "Invalid API key"),
            GroqError::RateLimit => write!(f, "Rate limit exceeded"),
            GroqError::Timeout => write!(f, "Request timeout"),
            GroqError::NetworkError(msg) => write!(f, "Network error: {}", msg),
            GroqError::ParseError(msg) => write!(f, "Parse error: {}", msg),
        }
    }
}

impl std::error::Error for GroqError {}

#[derive(Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: u32,
}

#[derive(Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Deserialize)]
struct ResponseMessage {
    content: String,
}

pub async fn send_completion(
    api_key: &str,
    system_prompt: &str,
    text: &str,
) -> Result<String, GroqError> {
    let client = Client::builder()
        .timeout(Duration::from_secs(TIMEOUT_SECONDS))
        .build()
        .map_err(|e| GroqError::NetworkError(e.to_string()))?;

    let request_body = ChatCompletionRequest {
        model: GROQ_MODEL.to_string(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system_prompt.to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: text.to_string(),
            },
        ],
        temperature: 0.3,
        max_tokens: 2048,
    };

    let response = client
        .post(GROQ_API_ENDPOINT)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request_body)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                GroqError::Timeout
            } else {
                GroqError::NetworkError(e.to_string())
            }
        })?;

    let status = response.status();

    if status == reqwest::StatusCode::UNAUTHORIZED {
        return Err(GroqError::InvalidApiKey);
    }

    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        return Err(GroqError::RateLimit);
    }

    if !status.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(GroqError::NetworkError(format!(
            "HTTP {}: {}",
            status, error_text
        )));
    }

    let response_body: ChatCompletionResponse = response
        .json()
        .await
        .map_err(|e| GroqError::ParseError(e.to_string()))?;

    response_body
        .choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
        .ok_or_else(|| GroqError::ParseError("No choices in response".to_string()))
}
