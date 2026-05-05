CREATE TABLE IF NOT EXISTS CommunityPost (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category VARCHAR(32) NOT NULL DEFAULT '자유',
  name VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  reg_dt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_community_post_reg_dt (reg_dt DESC, id DESC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CommunityAttachment (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  reg_dt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_community_attachment_post_id (post_id, id),
  CONSTRAINT fk_community_attachment_post
    FOREIGN KEY (post_id)
    REFERENCES CommunityPost (id)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
