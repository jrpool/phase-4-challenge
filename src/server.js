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
  signinRequired: 'You must sign in before doing that.',
  otherwise: 'Something was wrong with the inputs.'
}

const getUserID = req => {
  if (req.session && req.session.user) {
    return req.session.user.id
  }
  else {
    return undefined;
  }
}

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
  const userID = getUserID(req);
  if (userID) {
    return [
      getLink(hidables.includes('profile'), 'profile', userID),
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

const renderError = (error, req, res) => {
  res.status(500).render(
    'error', {error, statusLinks: getStatusLinks(req, [])}
  )
}

// ##################### ROUTES START #####################

app.get('/', (req, res) => {
  db.getAlbums((error, albums) => {
    if (error) {
      renderError(error, req, res)
    } else {
      db.getReviewViews(3, (error, reviewViews) => {
        if (error) {
          renderError(error, req, res)
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
      renderError(error, req, res)
    }
    else if (albums.length) {
      db.getAlbumReviewViews(albumID, 0, (error, reviewViews) => {
        if (error) {
          renderError(error, req, res)
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
      renderError(error, req, res)
    } else {
      const album = albums[0]
      res.render(
        'new-review', {album, statusLinks: getStatusLinks(req, [])}
      )
    }
  })
})

app.get('/users/:userID(\\d+)', (req, res) => {
  const shownUserID = Number.parseInt(req.params.userID, 10)
  const ownUserID = getUserID(req)
  const isOwnProfile = shownUserID === ownUserID
  console.log('isOwnProfile is ' + isOwnProfile)
  console.log('shownUserID is ' + shownUserID)
  console.log('ownUserID is ' + ownUserID)
  console.log('session is ' + JSON.stringify(req.session))
  db.getUsersByID(shownUserID, (error, users) => {
    if (error) {
      renderError(error, req, res)
    }
    else if (users.length) {
      db.getUserReviewViews(shownUserID, 0, (error, reviewViews) => {
        if (error) {
          renderError(error, req, res)
        }
        else {
          /*
            Suppress profile button if, and suppress review-delete buttons
            unless, user’s own profile is being displayed.
          */
          res.render(
            'user', {
              user: users[0],
              statusLinks: getStatusLinks(
                req, isOwnProfile ? ['profile'] : []
              ),
              reviewViews,
              reviewDeleteToolClass: isOwnProfile ? 'visible' : 'invisible'
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

app.get('/reviews/:reviewID(\\d+)/delete', (req, res) => {
  const userID = getUserID(req)
  if (!userID) {
    const error = {
      message: messages.signinRequired,
      stack: '/reviews/:reviewID/delete'
    }
    renderError(error, req, res)
  }
  else {
    const reviewID = req.params.reviewID
    res.render('user', {
      user: req.session.user,
      statusLinks: getStatusLinks(
        req, isOwnProfile ? ['profile'] : []
      ),
      reviewViews,
      target: reviewID,
      message: 'Are you sure you want to delete this review?',
      reviewDeleteToolClass: isOwnProfile ? 'visible' : 'invisible',
      confirmClass = 'visible',
      confirmLinks = [
        [`/reviews/${reviewID}/delete/confirm`, 'Confirm'],
        [`/users/${userID}`, 'Cancel']
      ]
    })
  }
})

app.get('/reviews/:reviewID(\\d+)/delete/confirm', (req, res) => {
  const userID = getUserID(req)
  if (!userID) {
    const error = {
      message: messages.signinRequired,
      stack: '/reviews/:reviewID/delete/confirm'
    }
    renderError(error, req, res)
  }
  else {
    const reviewID = req.params.reviewID
    db.deleteReview(reviewID, userID, (error, result_rows) => {
      if (error) {
        renderError(error, req, res)
      }
      else {
        res.redirect(`/users/${userID}`)
      }
    })
  }
})

app.get('/not-found', (req, res) => {
  res.status(404).render(
    'not-found', {message: '', statusLinks: getStatusLinks(req, [])}
  )
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
      renderError(error, req, res)
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
      renderError(error, req, res)
    }
    else if (result_rows.length && result_rows[0].answer) {
      db.createUser(
        formData.name,
        formData.email,
        formData.password,
        (error, result_rows) => {
          if (error) {
            renderError(error, req, res);
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
  const userID = getUserID(req)
  if (!userID) {
    const error = {
      message: messages.signinRequired,
      stack: '/albums/:albumID/reviews/new'
    }
    renderError(error, req, res)
  }
  else if (!formData.review) {
    res.redirect('/not-found')
  }
  else {
    db.createReview(
      req.params.albumID,
      userID,
      formData.review,
      (error, result_rows) => {
        if (error) {
          renderError(error, req, res)
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
  res.redirect('/not-found')
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}...`)
})
