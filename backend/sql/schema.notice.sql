CREATE TABLE IF NOT EXISTS Notice (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type VARCHAR(32) NOT NULL DEFAULT '공지',
  name VARCHAR(64) NOT NULL DEFAULT '관리자',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  reg_dt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_notice_reg_dt (reg_dt DESC, id DESC)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

INSERT INTO Notice (type, name, title, message, view_count, reg_dt) VALUES
('점검', '관리자', '[정기점검] 05/03 02:00~05:00 서버 점검 안내', '안정적인 서비스 제공을 위해 2026-05-03 02:00부터 05:00까지 정기점검이 진행됩니다.', 1832, '2026-05-01 09:00:00'),
('업데이트', '관리자', '[패치노트] 1.7.2 버전 업데이트 내용 안내', '1.7.2 버전 업데이트로 신규 밸런스 조정과 편의성 개선 사항이 적용됩니다.', 2541, '2026-04-29 10:30:00'),
('이벤트', '관리자', '[이벤트] 주말 접속 보상 지급 이벤트 안내', '주말 기간 접속한 모든 계정에 접속 보상이 순차 지급됩니다.', 1490, '2026-04-27 12:00:00'),
('공지', '관리자', '[안내] 문의 접수 처리 시간 변경 공지', '고객센터 문의 접수 처리 시간이 평일 10:00~18:00로 변경됩니다.', 902, '2026-04-25 15:00:00'),
('보안', '관리자', '[중요] 계정 정보 보호를 위한 비밀번호 변경 권고', '계정 정보 보호를 위해 주기적인 비밀번호 변경을 권고드립니다.', 3218, '2026-04-22 11:20:00');
