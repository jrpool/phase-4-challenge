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
  missing2Credentials: 'Both a name and a password are required.',
  missingNameOrEmail: 'Both a name and an email address are required.',
  missing3Credentials: 'A username, email address, and password are required.',
  signinRequired: 'You must sign in before doing that.',
  forbidden: 'You do not have permission to do that.',
  noMissing: 'You must make an entry into each field.',
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

let message = '',
  confirmClass = 'visible',
  statusLinks = [['', '', ''], ['', '', '']],
  confirmLinks = [['', ''], ['', '']]

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
            {
              albums,
              reviewViews,
              statusLinks: getStatusLinks(req, []),
              navTarget: 'Users',
              navRef: '/users'
            }
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

app.get('/albums/new', (req, res) => {
  res.render(
    'new-album', {message: '', statusLinks: getStatusLinks(req, [])}
  )
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

app.get('/users', (req, res) => {
  db.getUsers((error, users) => {
    if (error) {
      renderError(error, req, res)
    }
    else if (users.length) {
      res.render(
        'users', {
          statusLinks: getStatusLinks(req, []),
          users
        }
      )
    }
    else {
      res.redirect('/not-found')
    }
  })
})

app.get('/users/:userID(\\d+)', (req, res) => {
  const shownUserID = Number.parseInt(req.params.userID, 10)
  const ownUserID = getUserID(req)
  const isOwnProfile = shownUserID === ownUserID
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
              imageurl: users[0].imageurl || '/photo-blank.png',
              statusLinks: getStatusLinks(
                req, isOwnProfile ? ['profile'] : []
              ),
              target: '',
              confirmInvitation: '',
              confirmClass: 'invisible',
              confirmLinks: [['', ''], ['', '']],
              reviewViews,
              editUserClass: isOwnProfile ? 'visible' : 'invisible'
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

app.get('/users/:userID(\\d+)/update', (req, res) => {
  const shownUserID = Number.parseInt(req.params.userID, 10)
  const ownUserID = getUserID(req)
  const isOwnProfile = shownUserID === ownUserID
  if (!isOwnProfile) {
    const error = {
      message: messages.forbidden,
      stack: '/users/:userID/update'
    }
    renderError(error, req, res)
  }
  else {
    db.getUsersByID(shownUserID, (error, users) => {
      if (error) {
        renderError(error, req, res)
      }
      else if (users.length) {
        res.render('edit-user', {
          user: users[0],
          statusLinks: getStatusLinks(req, ['profile']),
        })
      }
      else {
        res.redirect('/not-found')
      }
    })
  }
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
    const reviewID = Number.parseInt(req.params.reviewID, 10)
    db.getAuthorID(reviewID, (error, result_rows) => {
      if (error) {
        renderError(error, req, res)
      }
      else if (result_rows[0].author !== userID) {
        const error = {
          message: messages.forbidden,
          stack: '/reviews/:reviewID/delete'
        }
        renderError(error, req, res)
      }
      else {
        db.getUsersByID(userID, (error, users) => {
          if (error) {
            renderError(error, req, res)
          }
          else if (users.length) {
            db.getUserReviewViews(userID, 0, (error, reviewViews) => {
              if (error) {
                renderError(error, req, res)
              }
              else {
                res.render('user', {
                  user: users[0],
                  statusLinks: getStatusLinks(req, ['profile']),
                  reviewViews,
                  target: reviewID,
                  confirmInvitation:
                    'Are you sure you want to delete this review?',
                  editUserClass: 'hidden',
                  confirmClass: 'visible',
                  confirmLinks: [
                    [`/reviews/${reviewID}/delete/confirm`, 'Confirm'],
                    [`/users/${userID}`, 'Cancel']
                  ]
                })
              }
            })
          }
        })
      }
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
        formData.imageurl,
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

app.post('/users/:userID(\\d+)/update', (req, res) => {
  const shownUserID = Number.parseInt(req.params.userID, 10)
  const ownUserID = getUserID(req)
  const isOwnProfile = shownUserID === ownUserID
  if (!isOwnProfile) {
    const error = {
      message: messages.forbidden,
      stack: '/users/:userID/update/post'
    }
    renderError(error, req, res)
  }
  else {
    const formData = req.body
    if (!formData.name || !formData.email) {
      res.render('edit-user', {
        message: messages.missingNameOrEmail,
        statusLinks: getStatusLinks(req, ['signup'])
      })
      return
    }
    db.isEmailUnique(formData.email, ownUserID, (error, result_rows) => {
      if (error) {
        renderError(error, req, res)
      }
      else if (result_rows.length && result_rows[0].answer) {
        db.updateUser(
          ownUserID,
          formData.name,
          formData.email,
          formData.imageurl,
          (error, result_rows) => {
            if (error) {
              renderError(error, req, res);
            }
            else {
              res.redirect(`/users/${ownUserID}`)
            }
          }
        )
      }
      else {
        res.render('edit-user', {
          message: messages.alreadyUser,
          statusLinks: getStatusLinks(req, ['signup'])
        })
      }
    })
  }
})

app.post('/albums/new', (req, res) => {
  const formData = req.body
  const userID = getUserID(req)
  if (!userID) {
    const error = {
      message: messages.signinRequired,
      stack: '/albums/new'
    }
    renderError(error, req, res)
  }
  else if (!formData.title || !formData.artist) {
    const error = {
      message: messages.noMissing,
      stack: '/albums/new'
    }
    renderError(error, req, res)
  }
  else {
    db.createAlbum(
      formData.title,
      formData.artist,
      (error, result_rows) => {
        if (error) {
          renderError(error, req, res)
        }
        else {
          res.redirect(`/albums/${result_rows[0].id}`)
        }
      }
    )
  }
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
  console.log('Attempted URL:\n' + req.path + '\n' + req.url)
  res.redirect('/not-found')
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}...`)
})
