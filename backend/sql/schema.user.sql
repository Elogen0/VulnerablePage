CREATE DATABASE IF NOT EXISTS my_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE my_db;

CREATE TABLE IF NOT EXISTS UserAccount (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  login_id VARCHAR(64) NOT NULL,
  passwd VARCHAR(128) NOT NULL,
  salt VARCHAR(128) NOT NULL,
  fullName VARCHAR(64) NOT NULL,
  grade INT NOT NULL DEFAULT 1,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  reg_dt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_account_login_id (login_id),
  INDEX idx_user_account_deleted_login_id (deleted, login_id),
  INDEX idx_user_account_deleted_full_name (deleted, fullName)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
