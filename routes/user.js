/*
 * Views after logging in
 */

var AlbumModels = require('../models/album');
var ImageUtils = require('./images.js');
var config = require('../config.js');
var User = require('../models/user');

exports.home = function(req, res) {
  
  function findAlbums(err, albums) {
    response.albums = albums;

    // Find shared albums for user
    AlbumModels.Album.find({sharedStatus: 'private', sharedEmails: req.user.email}, function(err, sharedAlbums){
      if(err) {
        console.log(err);
      }
      if(sharedAlbums.length) {
        response.sharedAlbums = sharedAlbums;
      }
      res.render('user', response);
    });
  }

  var response = {};
  if(!req.user) {
    res.redirect('/');
    return;
  }
  response.user = req.user;
  AlbumModels.Album.find({user: req.user._id}, findAlbums);
};

exports.album = function(req, res) {

  function findPictures(err, album) {
    if(err) {
      console.log(err);
      res.render(404);
      return;
    }
    if (album) {
      response.album = album;
      AlbumModels.Picture.find({album: album._id}, getSignedURLs);
    } else {
      res.render(404);
    }
  }

  function getSignedURLs(err, pictures) {
    if (err) { 
      console.log(err);
      res.send(500, 'Server error occured');
      return;
    }

    response.pictures = pictures;
    // TODO: Check whether this synchronous call is ok
    var params = {};
    for(var i = 0; i < pictures.length; i++) {
      params = {
        Bucket: 'zenpics/' + pictures[i].album,
        Key: '' + pictures[i]._id + pictures[i].name,
        Expires: 60 * 60
      }
      pictures[i].url = ImageUtils.getSignedURL(params);
      params.Key = 'thumb-' + params.Key;
      pictures[i].thumbUrl = ImageUtils.getSignedURL(params);
    }

    // Check whether the logged in user is the creator of the album.
    if(req.user && 
      response.album.user.toString() === req.user._id.toString()) {
      res.render('user/album.ejs', response);
      return;
    }

    // Is this a privately shared album using email?
    if(req.user && 
      response.album.sharedStatus === 'private' &&
      response.album.sharedEmails.indexOf(req.user.email) !== -1) {
      User.findOne({_id: response.album.user}, function(err, uploader){
        response.uploader = uploader;
        res.render('user/private-album.ejs', response);
      });
    return;
    }

    // Is this album for logged in users?
    if(req.user && response.album.sharedStatus === 'loggedin') {
      res.render('user/private-album.ejs', response);
      return;
    }

    // Check for public album
    if(response.album.sharedStatus === 'public') {
      if(!req.user) {
        res.render('pages/album.ejs', response);
      } else {
        res.render('user/private-album.ejs', response);
      }
      return;
    }

    res.render(404);
  }

  var id = req.params.id;
  var response = {};
  AlbumModels.Album.findOne({'_id': id}, findPictures);
};

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};