CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL UNIQUE,
  age SMALLINT UNSIGNED NOT NULL,
  otp_verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(24) NOT NULL,
  otp_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  send_status VARCHAR(32) NOT NULL DEFAULT 'sent',
  verified_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone_created (phone, created_at)
);

CREATE TABLE IF NOT EXISTS generation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  phone VARCHAR(24) NOT NULL,
  bike_type VARCHAR(120) NOT NULL,
  environment VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'processing',
  provider VARCHAR(40) NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_generation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_generation_phone_created (phone, created_at),
  INDEX idx_generation_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  phone VARCHAR(24) NOT NULL,
  bike_type VARCHAR(120) NOT NULL,
  environment VARCHAR(120) NOT NULL,
  provider VARCHAR(40) NULL,
  model VARCHAR(120) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  retry_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  queue_message_id VARCHAR(190) NULL,
  error_message TEXT NULL,
  payload_json JSON NULL,
  result_summary TEXT NULL,
  result_caption TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_generation_job_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_generation_jobs_status_created (status, created_at),
  INDEX idx_generation_jobs_phone_created (phone, created_at),
  INDEX idx_generation_jobs_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS generation_job_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_generation_job_events_job FOREIGN KEY (job_id) REFERENCES generation_jobs(id) ON DELETE CASCADE,
  INDEX idx_generation_job_events_job_created (job_id, created_at)
);
