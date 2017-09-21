TRUNCATE reviews, albums, users;
SELECT SETVAL('reviews_id_seq', 1, false);
SELECT SETVAL('albums_id_seq', 1, false);
SELECT SETVAL('users_id_seq', 1, false);

INSERT INTO
  users (name, email, imageurl, password, join_date)
VALUES
  (
    'Jonathan Pool',
    'pool@stulta.com',
    'https://panlex.org/people/pool.jpg',
    'phase-3-learner',
    '2017-09-18'
  ),
  (
    'Barbara Lee',
    'blee@house.gov',
    'https://i1.wp.com/sfbayview.com/wp-content/uploads/2015/01/Barbara-Lee.jpg?resize=90%2C90',
    'east-bay-rep',
    '2017-09-01'
  ),
  (
    'Alan Turing',
    'turing@tributes.com',
    'http://turing.cs.washington.edu/IMAGES/main/_turing.jpg',
    'cs-pioneer',
    '2017-09-10'
  ),
  (
    'Kenneth Arrow',
    'arrow@legacy.com',
    'http://fsi.stanford.edu/sites/default/files/staff/2004/626-small_Arrow.jpg',
    'great-economist',
    '2017-09-15'
  ),
  (
    'Abominable Snowman',
    'snowman@legends.com',
    null,
    'faker',
    '2017-09-20'
  ),
  (
    'Antonin Dvořák',
    'newworld@composers.com',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Dvorak_1868.jpg/170px-Dvorak_1868.jpg',
    'romantic',
    '2017-09-21'
  )
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
  (4, 1, 'Sandpaper scrapes, plus a few musical moments.', '2017-09-19'),
  (5, 1, 'An hour’s escape to a world without evil.', '2017-09-20'),
  (2, 2, 'It would make a great anthem for Occupy.', '2017-09-03'),
  (3, 4, 'It reminds me of Milton Friedman.', '2017-09-15'),
  (4, 6, 'Sorry, it hasn’t been composed yet, so no opinion.', '1902-11-13')
;
