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

const isUser = req => req.session && req.session.user && req.session.user.id

const getLink = (hidable, linkKey, id) => {
  const className = hidable ? 'invisible' : 'visible'
  const links = {
    signup: [className, 'Sign up', '/sign-up'],
    signin: [className, 'Sign in', '/sign-in'],
    profile: [className, 'Profile', `/users/${id}`],
    signout: [className, 'Sign out', '/sign-out']
  }
  return links[linkKey]
}

const getStatusLinks = (req, hidables) => {
  if (isUser(req)) {
    return [
      getLink(hidables.includes('profile'), 'profile', req.session.user.id),
      getLink(hidables.includes('signout'), 'signout')
    ]
  }
  else {
    return [
      getLink(hidables.includes('signin'), 'signin'),
      getLink(hidables.includes('signup'), 'signup')
    ]
  }
}

const renderError = (error, req) => {
  res.status(500).render(
    'error', {error, statusLinks: getStatusLinks(req, [])}
  )
}

// ##################### ROUTES START #####################

app.get('/', (req, res) => {
  db.getAlbums((error, albums) => {
    if (error) {
      renderError(error, req)
    } else {
      db.getReviewViews(3, (error, reviewViews) => {
        if (error) {
          renderError(error, req)
        }
        else {
          res.render(
            'index',
            {albums, reviewViews, statusLinks: getStatusLinks(req, [])}
          )
        }
      })
    }
  })
})

app.get('/sign-up', (req, res) => {
  res.render(
    'sign-up', {message: '', statusLinks: getStatusLinks(req, ['signup'])}
  )
})

app.get('/sign-in', (req, res) => {
  res.render(
    'sign-in', {message: '', statusLinks: getStatusLinks(req, ['signin'])}
  )
})

app.get('/sign-out', (req, res) => {
  delete req.session.user
  res.redirect('/')
})

app.get('/albums/:albumID(\\d+)', (req, res) => {
  const albumID = req.params.albumID
  db.getAlbumsByID(albumID, (error, albums) => {
    if (error) {
      renderError(error, req)
    }
    else if (albums.length) {
      db.getAlbumReviewViews(albumID, 0, (error, reviewViews) => {
        if (error) {
          renderError(error, req)
        }
        else {
          res.render(
            'album', {
              album: albums[0],
              reviewViews,
              statusLinks: getStatusLinks(req, [])
            }
          )
        }
      })
    }
    else {
      res.redirect('/not-found')
    }
  })
})

app.get('/albums/:albumID(\\d+)/reviews/new', (req, res) => {
  const albumID = req.params.albumID
  db.getAlbumsByID(albumID, (error, albums) => {
    if (error) {
      renderError(error, req)
    } else {
      const album = albums[0]
      res.render(
        'new-review', {album, statusLinks: getStatusLinks(req, [])}
      )
    }
  })
})

app.get('/users/:userID(\\d+)', (req, res) => {
  const userID = req.params.userID
  const isOwnProfile = isUser(req) && userID === req.session.user.id
  db.getUsersByID(userID, (error, users) => {
    if (error) {
      renderError(error, req)
    } else {
      const user = users[0]
      // Suppress profile button if user’s own profile is being displayed.
      res.render(
        'user', {
          user,
          statusLinks: getStatusLinks(req, isOwnProfile ? ['profile'] : [])
        }
      )
    }
  })
})

app.post('/sign-in', (req, res) => {
  const formData = req.body
  if (!formData.email || !formData.password) {
    res.render('sign-up', {
      message: messages.missing2Credentials,
      statusLinks: getStatusLinks(req, ['signup'])
    })
    return
  }
  db.getUser(formData.email, formData.password, (error, result_rows) => {
    if (error) {
      renderError(error, req)
    }
    else if (result_rows.length && result_rows[0].id) {
      const user = result_rows[0]
      req.session.user = {id: user.id, name: user.name, email: formData.email}
      res.redirect(`/users/${user.id}`)
    }
    else {
      res.render('sign-in', {
        message: messages.badSignin,
        statusLinks: getStatusLinks(req, ['signin'])
      })
    }
  })
})

app.post('/sign-up', (req, res) => {
  const formData = req.body
  if (!formData.name || !formData.email || !formData.password) {
    res.render('sign-up', {
      message: messages.missing3Credentials,
      statusLinks: getStatusLinks(req, ['signup'])
    })
    return
  }
  db.isEmailNew(formData.email, (error, result_rows) => {
    if (error) {
      renderError(error, req)
    }
    else if (result_rows.length && result_rows[0].answer) {
      db.createUser(
        formData.name,
        formData.email,
        formData.password,
        (error, result_rows) => {
          if (error) {
            renderError(error, req);
          }
          else {
            const id = result_rows[0].id
            req.session.user = {id, name: formData.name, email: formData.email}
            res.redirect(`/users/${id}`)
          }
        }
      )
    }
    else {
      res.render('sign-up', {
        message: messages.alreadyUser,
        statusLinks: getStatusLinks(req, ['signup'])
      })
    }
  })
})

app.post('/albums/:albumID(\\d+)/reviews/new', (req, res) => {
  const formData = req.body
  if (!isUser(req) || !formData.review) {
    renderError(error, req)
  }
  else  {
    db.createReview(
      req.params.albumID,
      req.session.user.id,
      formData.review,
      (error, result_rows) => {
        if (error) {
          renderError(error, req)
        }
        else {
          res.redirect(`/albums/${req.params.albumID}`)
        }
      }
    )
  }
})

// ##################### ROUTES END #####################

app.use((req, res) => {
  res.status(404).render(
    'not-found', {statusLinks: getStatusLinks(req, [])}
  )
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}...`)
})
