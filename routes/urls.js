// URLS defined by all the routes
// all apis consumed by js on frontend
var apis = require('./api.js');
// all pages outside login
var pages = require('./index.js');
var user = require('./user.js');

module.exports = function(app, passport) {
  // Pages outside login
  app.get('/', pages.index);

  // authentication pages
  app.get('/auth/login/google', passport.authenticate('google'));
  app.get('/auth/callback/google', 
    passport.authenticate('google', { successRedirect: '/',
    failureRedirect: '?loginError=true' })
  );

  // pages after login
  app.get('/home', user.home);
  app.get('/album/:id', user.album);
  app.get('/logout', user.logout);

  // APIs
  app.get('/api/album/:id', apis.AlbumOne);
  app.get('/api/album', apis.AlbumAll);
  app.post('/api/album', apis.AlbumNew);
  app.put('/api/album', apis.AlbumUpdate);
  app.delete('/api/album', apis.AlbumDelete);
  app.put('/api/album/emails', apis.AlbumEmailUpdate);
  app.delete('/api/album/emails', apis.AlbumEmailDelete);
  app.get('/api/picture/:album', apis.PictureAll);
  app.post('/api/picture', apis.PictureNew);
  app.delete('/api/picture', apis.PictureDelete);
}