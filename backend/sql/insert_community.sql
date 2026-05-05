INSERT INTO CommunityPost (category, name, title, message, view_count, reg_dt) VALUES
  ('자유', 'Dummy User 01', '오늘 처음 접속해봤습니다', '튜토리얼 끝내고 커뮤니티 둘러보는 중입니다. 같이 플레이하실 분
  있으면 댓글 주세요.', 12, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)),
  ('질문', 'Dummy User 02', '초반 장비는 뭐부터 맞추면 좋나요?', '레벨업 중인데 무기부터 올릴지 방어구부터 올릴지 고민입
  니다. 추천 부탁드립니다.', 34, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)),
  ('공략', 'Dummy User 03', '초반 파밍 루트 간단 정리', '시작 지역 기준으로 보급 상자 위치를 먼저 돌고, 이후 북쪽 창고를
  확인하면 효율이 괜찮았습니다.', 87, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)),
  ('길드', 'Dummy User 04', '주말 같이 하실 길드원 모집합니다', '가볍게 플레이하는 길드입니다. 접속 시간은 주로 저녁이고
  신규 유저도 환영합니다.', 45, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 4 DAY)),
  ('자유', 'Dummy User 05', '이번 패치 후 체감 어떤가요?', '이동 속도랑 반동이 조금 달라진 것 같은데 다른 분들은 어떻게
  느끼셨나요?', 61, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)),
  ('질문', 'Dummy User 01', '파티 매칭은 어디서 하나요?', '혼자 진행하다가 막히는 구간이 있어서 파티 매칭 방법을 찾고 있
  습니다.', 19, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 6 DAY)),
  ('공략', 'Dummy User 02', '보급 상자 확인 팁', '상자는 리젠 시간이 있으니 같은 지역을 계속 돌기보다 동선을 크게 잡는
  게 좋았습니다.', 73, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)),
  ('자유', 'Dummy User 03', '스킨 디자인 괜찮네요', '이번에 추가된 기본 스킨 색감이 생각보다 깔끔해서 마음에 듭니다.',
  28, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 8 DAY)),
  ('길드', 'Dummy User 04', '신규 유저 같이 성장하실 분', '부담 없이 퀘스트 같이 밀 분 구합니다. 닉네임 남겨주세요.',
  52, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 9 DAY)),
  ('질문', 'Dummy User 05', '랭크전 입장 조건이 궁금합니다', '랭크전이 잠겨 있는데 레벨 조건인지 퀘스트 조건인지 모르겠
  습니다.', 40, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 DAY));