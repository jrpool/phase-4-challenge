const pg = require('pg')

const dbName = 'vinyl'
const connectionString = process.env.DATABASE_URL || `postgres://localhost:5432/${dbName}`
const client = new pg.Client(connectionString)

client.connect()

function getAlbums(cb) {
  _query('SELECT * FROM albums', [], cb)
}

function getAlbumsByID(albumID, cb) {
  _query('SELECT * FROM albums WHERE id = $1', [albumID], cb)
}

function getUsers(cb) {
  _query('SELECT * FROM users', [], cb)
}

function getUsersByID(userID, cb) {
  _query('SELECT * FROM users WHERE id = $1', [userID], cb)
}

function getReviewViews(countLimit, cb) {
  const limitText = countLimit ? ` limit ${countLimit}` : ''
  _query(
    `SELECT albums.id as album_id, albums.title as album_title, reviews.submission_date, reviews.review, users.id as author_id, users.name as author_name FROM reviews, albums, users WHERE albums.id = reviews.album AND users.id = reviews.author order by reviews.submission_date desc${limitText}`,
    [],
    cb
  )
}

function getAlbumReviewViews(album, countLimit, cb) {
  const limitText = countLimit ? ` limit ${countLimit}` : ''
  _query(
    `SELECT reviews.submission_date, reviews.review, users.id as author_id, users.name as author_name FROM albums, reviews, users WHERE albums.id = $1 AND reviews.album = albums.id AND users.id = reviews.author order by reviews.submission_date desc${limitText}`,
    [album],
    cb
  )
}

function getUserReviewViews(user, countLimit, cb) {
  const limitText = countLimit ? ` limit ${countLimit}` : ''
  _query(
    `SELECT reviews.id, albums.title as album, reviews.submission_date, reviews.review FROM reviews, albums WHERE reviews.author = $1 AND albums.id = reviews.album order by reviews.submission_date desc${limitText}`,
    [user],
    cb
  )
}

function getAuthorID(reviewID, cb) {
  _query(
    'SELECT author FROM reviews WHERE id = $1', [reviewID], cb
  )
}

function isEmailNew(email, cb) {
  _query(
    'SELECT COUNT(id) = 0 AS answer FROM users WHERE email = $1', [email], cb
  )
}

function createUser(name, email, password, cb) {
  _query(
    'INSERT INTO users (name, email, password) '
    + 'VALUES ($1, $2, $3) RETURNING id',
    [name, email, password],
    cb
  );
};

function getUser(email, password, cb) {
  _query(
    'SELECT id, name FROM users WHERE email = $1 AND password = $2',
    [email, password],
    cb
  );
};

function createReview(album, author, review, cb) {
  _query(
    'INSERT INTO reviews (album, author, review) '
    + 'VALUES ($1, $2, $3) RETURNING id',
    [album, author, review],
    cb
  );
};

function deleteReview(id, author, cb) {
  _query(
    'DELETE FROM reviews WHERE id = $1 AND author = $2 RETURNING id',
    [id, author],
    cb
  );
};

function _query(sql, variables, cb) {
  console.log('QUERY ->', sql.replace(/[\n\s]+/g, ' '), variables)

  client.query(sql, variables, (error, result) => {
    if (error) {
      console.log('QUERY -> !!ERROR!!')
      console.error(error)
      cb(error)
    } else {
      console.log('QUERY ->', JSON.stringify(result.rows))
      cb(error, result.rows)
    }
  })
}

module.exports = {
  createReview,
  createUser,
  deleteReview,
  getAlbumReviewViews,
  getAlbums,
  getAlbumsByID,
  getAuthorID,
  getReviewViews,
  getUser,
  getUserReviewViews,
  getUsers,
  getUsersByID,
  isEmailNew
}
