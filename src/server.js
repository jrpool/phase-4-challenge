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

const messages = {
  badLogin: 'Your username-password combination was invalid.',
  alreadyUser: 'Someone with that email address is already registered.',
  missing2Credentials: 'Both a username and a password are required.',
  missing3Credentials: 'A username, email address, and password are required.',
  otherwise: 'Something was wrong with the inputs.'
};

// ##################### ROUTES START #####################

app.get('/', (req, res) => {
  db.getAlbums((error, albums) => {
    if (error) {
      res.status(500).render('error', {error})
    } else {
      res.render('index', {albums})
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

app.post('/sign-up', (req, res) => {
  const formData = req.body;
  if (!formData.name || !formData.email || !formData.password) {
    res.render('sign-up', {message: messages.missing3Credentials});
    return;
  }
  // DbUsers.checkUser(formData)
  // .then(user => {
  //   if (user !== null) {
  //     renderMessage('alreadyUser', response);
  //     return '';
  //   }
  //   else {
  //     const userPromise = DbUsers.createUser(formData);
  //     const contactsPromise = DbContacts.getContacts();
  //     Promise.all([userPromise, contactsPromise])
  //     .then(valueArray => {
  //       request.session.user = {
  //         username: valueArray[0].username, admin: valueArray[0].admin
  //       };
        response.redirect('/');
  //     });
  //   }
  // })
  // .catch(error => renderError(error, request, response));
});

// ##################### ROUTES END #####################

app.use((req, res) => {
  res.status(404).render('not-found')
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}...`)
})
