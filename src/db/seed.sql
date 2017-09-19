TRUNCATE reviews, albums, users;
SELECT SETVAL('reviews_id_seq', 1, false);
SELECT SETVAL('albums_id_seq', 1, false);
SELECT SETVAL('users_id_seq', 1, false);

INSERT INTO
  users (name, email, password, join_date)
VALUES
  ('Jonathan Pool', 'pool@stulta.com', 'phase-3-learner', '2017-09-18'),
  ('Barbara Lee', 'blee@house.gov', 'east-bay-rep', '2017-09-01'),
  ('Alan Turing', 'turing@tributes.com', 'cs-pioneer', '2017-09-10'),
  ('Kenneth Arrow', 'arrow@legacy.com', 'great-economist', '2017-09-15')
;

INSERT INTO
  albums (title, artist)
VALUES
  ('Malibu', 'Anderson .Paak'),
  ('A Seat at the Table', 'Solange Knowles'),
  ('Melodrama', 'Lorde'),
  ('In Rainbows', 'Radiohead'),
  ('Octet in F major, D.803', 'Franz Schubert')
;

INSERT INTO
  reviews (album, author, review, submission_date)
VALUES
  (4, 1, 'Utterly horrible pseudo-music!', '2017-09-19'),
  (5, 1, 'An hour’s escape to a world without evil.', '2017-09-20'),
  (2, 2, 'It would make a great anthem for Occupy.', '2017-09-03'),
  (3, 3, 'It reminds me of Milton Friedman.', '2017-09-15')
;
