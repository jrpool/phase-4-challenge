TRUNCATE reviews;
SELECT SETVAL('reviews_id_seq', 1, false);

INSERT INTO
  reviews (album, author, review, submission_date)
VALUES
  (4, 1, 'Utterly horrible pseudo-music!', '2017-09-19'),
  (5, 1, 'An hour-long escape into a world that might have been.', '2017-09-20'),
  (2, 2, 'It would make a great anthem for Occupy.', '2017-09-03'),
  (3, 3, 'It reminds me of Milton Friedman', '2017-09-15')
;
