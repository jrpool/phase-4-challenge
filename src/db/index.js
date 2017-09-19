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
  _query(
    'SELECT albums.title as album, reviews.submission_date, reviews.review, users.name as author FROM reviews, albums, users WHERE albums.id = reviews.album AND users.id = reviews.author order by reviews.submission_date desc$1',
    [countLimit ? ` limit ${countLimit}` : ''],
    cb
  )
}

function getAlbumReviewViews(album, countLimit, cb) {
  _query(
    'SELECT albums.title as album, reviews.submission_date, reviews.review, users.name as author FROM albums, reviews, users WHERE albums.id = $1 AND reviews.album = album.id AND users.id = reviews.author order by reviews.submission_date desc$2',
    [album, countLimit ? ` limit ${countLimit}` : ''],
    cb
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
  getAlbums,
  getAlbumsByID,
  getReviewViews,
  getUser,
  getUsers,
  getUsersByID,
  isEmailNew
}
