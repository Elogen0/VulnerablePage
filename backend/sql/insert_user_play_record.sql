INSERT INTO UserPlayRecord
  (user_id, season, mode, matches, wins, losses, draws, kills, deaths, assists, score)
SELECT
  id, '2026 S1', 'Ranked', 128, 72, 49, 7, 856, 511, 302, 18420
FROM
  UserAccount
WHERE
  login_id = 'dummy01'
ON DUPLICATE KEY UPDATE
  matches = VALUES(matches),
  wins = VALUES(wins),
  losses = VALUES(losses),
  draws = VALUES(draws),
  kills = VALUES(kills),
  deaths = VALUES(deaths),
  assists = VALUES(assists),
  score = VALUES(score);

INSERT INTO UserPlayRecord
  (user_id, season, mode, matches, wins, losses, draws, kills, deaths, assists, score)
SELECT
  id, '2026 S1', 'Normal', 64, 31, 28, 5, 392, 244, 141, 7120
FROM
  UserAccount
WHERE
  login_id = 'dummy01'
ON DUPLICATE KEY UPDATE
  matches = VALUES(matches),
  wins = VALUES(wins),
  losses = VALUES(losses),
  draws = VALUES(draws),
  kills = VALUES(kills),
  deaths = VALUES(deaths),
  assists = VALUES(assists),
  score = VALUES(score);

INSERT INTO UserPlayRecord
  (user_id, season, mode, matches, wins, losses, draws, kills, deaths, assists, score)
SELECT
  id, '2026 S1', 'Ranked', 91, 44, 43, 4, 503, 421, 217, 11980
FROM
  UserAccount
WHERE
  login_id = 'dummy02'
ON DUPLICATE KEY UPDATE
  matches = VALUES(matches),
  wins = VALUES(wins),
  losses = VALUES(losses),
  draws = VALUES(draws),
  kills = VALUES(kills),
  deaths = VALUES(deaths),
  assists = VALUES(assists),
  score = VALUES(score);
