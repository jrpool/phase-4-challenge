const path = require('path')
const express = require('express')
const session = require('express-session');
const bodyParser = require('body-parser')
const db = require('./db')

const port = process.env.PORT || 3000

const app = express()

require('ejs')

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.static('src/public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(session({
  name: 'phase-4-challenge',
  resave: true,
  saveUninitialized: true,
  secret: process.env.SECRET || 'cookiesecret',
  cookie: {maxAge: 24 * 60 * 60 * 1000}
}))

const messages = {
  badSignin: 'Your username-password combination was invalid.',
  alreadyUser: 'Someone with that email address is already registered.',
  missing2Credentials: 'Both a username and a password are required.',
  missing3Credentials: 'A username, email address, and password are required.',
  otherwise: 'Something was wrong with the inputs.'
}

const getLink = (linkKey, id) => {
  const links = {
    sign-up: ['Sign up', '/sign-up'],
    sign-in: ['Sign in', '/sign-in'],
    profile: ['Profile', `/users/${id}`],
    sign-out: ['Sign out', '/sign-out']
  }
  return links[linkKey];
}

// ##################### ROUTES START #####################

app.get('/', (req, res) => {
  db.getAlbums((error, albums) => {
    if (error) {
      res.status(500).render('error', {error})
    } else {
      if (req.session && req.session.user) {
        link0 = getLink('profile', req.session.user.id);
        link1 = getLink('sign-out');
      }
      else {
        link0 = getLink('sign-in');
        link1 = getLink('sign-up');
      }
      // This is where to put the session-inspecting logic that sets link0
      // and link 1 to the right links for inclusion in the index view.
      res.render('index', {albums, link0, link1})
    }
  })
})

app.get('/sign-up', (req, res) => {
  res.render('sign-up', {message: ''})
})

app.get('/sign-in', (req, res) => {
  res.render('sign-in')
})

app.get('/albums/:albumID(\\d+)', (req, res) => {
  const albumID = req.params.albumID

  db.getAlbumsByID(albumID, (error, albums) => {
    if (error) {
      res.status(500).render('error', {error})
    } else {
      const album = albums[0]
      res.render('album', {album})
    }
  })
})

app.get('/albums/:albumID(\\d+)/reviews/new', (req, res) => {
  const albumID = req.params.albumID

  db.getAlbumsByID(albumID, (error, albums) => {
    if (error) {
      res.status(500).render('error', {error})
    } else {
      const album = albums[0]
      res.render('new-review', {album})
    }
  })
})

app.get('/users/:userID(\\d+)', (req, res) => {
  const userID = req.params.userID

  db.getUsersByID(userID, (error, users) => {
    if (error) {
      res.status(500).render('error', {error})
    } else {
      const user = users[0]
      res.render('user', {user})
    }
  })
})

app.post('/sign-in', (req, res) => {
  const formData = req.body
  if (!formData.email || !formData.password) {
    res.render('sign-up', {message: messages.missing2Credentials})
    return
  }
  db.getUserID(formData.email, formData.password, (error, result_rows) => {
    if (error) {
      res.status(500).render('error', {error})
    }
    else if (result_rows.length && result_rows[0].id) {
      res.redirect('/users/' + result_rows[0].id)
    }
    else {
      res.render('sign-in', {message: messages.badSignin})
    }
  })
})

app.post('/sign-up', (req, res) => {
  const formData = req.body
  if (!formData.name || !formData.email || !formData.password) {
    res.render('sign-up', {message: messages.missing3Credentials})
    return
  }
  db.isEmailNew(formData.email, (error, result_rows) => {
    if (error) {
      res.status(500).render('error', {error})
    }
    else if (result_rows.length && result_rows[0].answer) {
      db.createUser(
        formData.name,
        formData.email,
        formData.password,
        (error, result_rows) => {
          if (error) {
            res.status(500).render('error', {error})
          }
          else {
            const id = result_rows[0].id
            req.session.user = {id, name: formData.name}
            res.redirect(`/users/${id}`)
          }
        }
      )
    }
    else {
      res.render('sign-up', {message: messages.alreadyUser})
    }
  })
})

// ##################### ROUTES END #####################

app.use((req, res) => {
  res.status(404).render('not-found')
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}...`)
})
