TRUNCATE albums;
SELECT SETVAL('albums_id_seq', 1, false);

INSERT INTO
  albums (title, artist)
VALUES
  ('Malibu', 'Anderson .Paak'),
  ('A Seat at the Table', 'Solange Knowles'),
  ('Melodrama', 'Lorde'),
  ('In Rainbows', 'Radiohead'),
  ('Octet in F major, D.803', 'Franz Schubert')
;
