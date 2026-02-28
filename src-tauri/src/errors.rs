use thiserror::Error;

#[derive(Error, Debug)]
pub enum ShortForgeError {
    #[error("Video error: {0}")]
    Video(String),

    #[error("Audio error: {0}")]
    Audio(String),

    #[error("Export error: {0}")]
    Export(String),

    #[error("Project error: {0}")]
    Project(String),

    #[error("Template error: {0}")]
    Template(String),

    #[error("File I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
}

impl From<ShortForgeError> for String {
    fn from(err: ShortForgeError) -> String {
        err.to_string()
    }
}
