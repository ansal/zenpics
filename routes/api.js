// all apis consumed by js on frontend

var path = require('path');

var AlbumModels = require('../models/album');
var ImageUtils = require('./images.js');
var config = require('../config.js');
var jsonError = {error: 'Resource not found'};

// Gives a single album
exports.AlbumOne = function(req, res) {
  if(!req.user) {
    res.send(404, jsonError);
  } else {
    var id = req.params.id;
    var Album = AlbumModels.Album;
    Album.findOne({user: req.user._id, '_id': id}, function(err, album){
      if(err) { console.log(err); }
      if(album) {
        res.json(album);
      } else {
        res.send(404, jsonError);
      }
    });
  }
};
// List out all albums
exports.AlbumAll = function(req, res) {
  if(!req.user) {
    res.send(404, jsonError);
  } else {
    var Album = AlbumModels.Album;
    Album.find({user: req.user._id}, function(err, albums) {
      if (err) { console.log(err); }
      res.json(albums);
    });
  }
};
// Create a new album
exports.AlbumNew = function(req, res) {
  if(!req.user) {
    res.send(404, jsonError);
  } else {
    var album = new AlbumModels.Album({
      user: req.user._id,
      title: req.body.title,
      description: req.body.description
    });
    album.save(function(err){
      if(err) { console.log(err); }
      res.json(album);
    });
  }
};

// Update an album
exports.AlbumUpdate = function(req, res) {
  if(!req.user) {
    res.send(404, jsonError);
    return;
  }
  var id = req.body.id;
  var Album = AlbumModels.Album;
  var allowedSharedStatus = ['public', 'loggedin', 'private'];
  Album.findOne({user: req.user._id, '_id': id}, function(err, album){
    if(err) { console.log(err); }
    if(album) {
      album.title = req.body.title;
      album.description = req.body.description;
      album.sharedStatus = req.body.sharedStatus;
      if(allowedSharedStatus.indexOf(album.sharedStatus) === -1) {
        album.sharedStatus = 'private';
      }
      album.save(function(err){
        if(err) { console.log(err); }
        res.json(album);
      });
    } else {
      res.send(404, jsonError);
    }
  });
};

exports.AlbumDelete = function(req, res) {
  if(!req.user) {
    res.send(404, jsonError);
    return;
  }
  var id = req.body.id;
  var Album = AlbumModels.Album;
  Album.findOne({user: req.user._id, '_id': id}, function(err, album){
    if(err) { console.log(err); }
    if(album) {
      album.remove(function(err){
        if(err) {
          console.log(err);
          res.send(404, jsonError);
        } else {
          res.json({
            'success': true
          });
        }
      });
    } else {
      res.send(404, jsonError);
    }
  });
}

// Update an email address to a private album
exports.AlbumEmailUpdate = function(req, res) {
  if(!req.user) {
    res.send(404, jsonError);
    return;
  }
  var album = req.body.album;
  var email = req.body.email;
  if(!email) {
    res.json({error: 'Email id required!'});
    return;
  }
  var Album = AlbumModels.Album;
  Album.findOne({'user': req.user._id, _id: album}, function(err, album){
    if(err || !album) {
      res.json(jsonError);
      return;
    }
    if(album.sharedEmails.indexOf(email) === -1) {
      album.sharedEmails.push(email);
      // If an email is updated into private list, the album is converted it
      // into a private album. I came to this decision after thinking a lot.
      // This is the best choice I can make here!
      album.sharedStatus = 'private';
      album.save(function(err, album){
        if(err) { console.log(err); }
        res.json({
          success: 'Album successfully saved',
          album: album
        });
        return;
      });
    } else {
      res.json({'error': 'Email already in the list!'});
      return;
    }
  });
};

// Delete an email from a private album
exports.AlbumEmailDelete = function(req, res) {
  if(!req.user) {
    res.send(404, 'Request not authorized');
    return;
  }
  var album = req.body.album;
  var email = req.body.email;
  if(!email) {
    res.json({error: 'Email id required!'});
    return;
  }
  var Album = AlbumModels.Album;
  Album.findOne({'user': req.user._id, _id: album}, function(err, album){
    if(err || !album) {
      res.json({error: 'Album not found'});
      return;
    }
    // any operations on email addresses causes the album to be private
    album.sharedStatus = 'private';
    var emailIndex = album.sharedEmails.indexOf(email);
    if(emailIndex !== -1) {
      album.sharedEmails.splice(emailIndex, 1);
      album.save(function(err, album){
        if(err) {
          console.log(err);
          res.json({'error': 'Deleting email failed. Please try again.'});
          return;
        }
        res.json({album: album});
      });
    } else {
      res.json({error: 'Email not found in the list'});
    }
  });
};

// Gives out all pictures of a particular system
exports.PictureAll = function(req, res){
  if(!req.user) {
    res.send(404, 'Request not authorized');
  } else {
    var album = req.params.album;
    var Picture = AlbumModels.Picture;
    Picture.find({user: req.user._id, album: album}, function(err, pictures){
      if (err) { console.log(err); }
      // TODO: Check whether this synchronous call is ok
      var params = {}
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
      res.json(pictures);
    });
  }
};

/* Create a new picture as per the following steps.
   1. Uploads the picture to tmp folder.
   2. Resize the picture.
   3. Send the original version and resized one to S3.
   4. Create document in mongodb
*/
exports.PictureNew = function(req, res) {
  // constants
  var thumbPrefix = 'thumb-';
  var tmp = '/tmp/';
  var dimensions = {
    width: 300,
    height: 300
  };
  var bucketName = 'zenpics';

  if(!req.user) {
    res.send(404, 'Request not authorized')
  } else {
    if(typeof req.files.image === 'undefined') {
      res.send(404, 'Missing image');
    } else {
      // Validate file before upload
      if(config.imageUpload.allowedTypes.indexOf(req.files.image.type) 
        !== -1 &&
         req.files.image.size <= config.imageUpload.maxSize) {
        // Resize the image
        ImageUtils.resizeImage(req.files.image.path, 
          tmp + thumbPrefix + path.basename(req.files.image.path), 
          dimensions.width, dimensions.height, 
          function(){
          // check whether the album belongs to this user
          AlbumModels.Album.findOne({user: req.user._id,
            '_id': req.body.album}, function(err, album){
            if(err) { console.log(err); }
            if(album) {
              // Create document in mongodb
              var picture = AlbumModels.Picture({
                name: path.basename(req.files.image.path),
                displayName: req.files.image.name,
                user: req.user._id,
                album: req.body.album,
                url: 'error - url not set'
              });
              picture.save(function(err){
                if(err) { console.log(err); }
                var imageObjectName = 
                ImageUtils.sendfiletoS3(
                  bucketName,
                  album._id,
                  '' + picture._id + picture.name,
                  req.files.image.path,
                  function(err) {
                    if(err) { 
                      console.log(err);
                      picture.remove(function(err){
                        res.send(500, 'Upload failed');
                      });
                    } else {
                      // send the thumb image to S3 as well
                      ImageUtils.sendfiletoS3(
                        bucketName,
                        album._id,
                        thumbPrefix + picture._id + picture.name,
                        tmp + thumbPrefix + path.basename(req.files.image.path),
                        function(err) {
                          if (err) {
                            console.log(err);
                            picture.remove(function(err){
                              res.send(500, 'Upload failed');
                            });
                          } else {
                            res.json(picture);
                          }
                        }
                      );
                    }
                  }
                );
              });
            } else {
              res.send(404, 'User Album Not found');
            }
          }); 
        });
      } else {
        res.send(404, 'Image doesnot meet minimum requirements');
      }
    }
  }
}

// Deletes a picture
exports.PictureDelete = function(req, res) {
  if(!req.user) {
    res.send(404, 'Request not authorized');
    return;
  }
  var pictureId = req.body.id;
  var Picture = AlbumModels.Picture;
  Picture.findOne({_id: pictureId, user: req.user._id},function(err, picture){
    if(err) {
      console.log(err);
      res.send(404, jsonError);
      return;
    }
    if(!picture) {
      res.send(404, jsonError);
      return;
    }
    picture.remove(function(err){
      if(err) {
        console.log(err);
        res.send(404, {
          error: 'Cannot remove your picture'
        });
        return;
      }
      res.json({
        success: true
      });
    });
  });
};

// Favourites a Picture.
// Checks whether the picture is favourited or not. If favourited earlier,
// does not do anything. If not, favourites by saving an entry into favourite
// collection
exports.PictureFavourite = function(req,res) {
  if(!req.user) {
    res.send(404, 'Request not authorized');
    return;
  }
  
  var pictureId = req.body.id;
  var Favourite = AlbumModels.Favourite;
  var Picture = AlbumModels.Picture;

  function saveFavourite(err, fav){
    if(err) {
      res.send(404, 'Picture cannot be favourited');
      return;
    }
    res.send({
      success: 'Picture favourited successfully'
    });
  }

  function findFavourite(err, favourite) {
    if(err) {
      res.send(404, 'Picture cannot be favourited');
      return;
    }
    if(!favourite) {
      var favourite = new Favourite({
        picture: this.picture._id,
        user: req.user._id
      });
      favourite.save(saveFavourite);  
    } else {
      res.send({
        success: 'Picture favourited successfully'
      });   
    }
    
  }
  
  function findPicture(err, picture) {
    if(err || !picture) {
      res.send(404, 'Picture cannot be favourited/found');
      return;
    }
    Favourite.findOne({picture: picture._id, user: req.user._id}, findFavourite.bind({picture: picture}));
  }

  Picture.findOne({_id: pictureId, user: req.user._id}, findPicture);
};