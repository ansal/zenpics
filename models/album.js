var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
 
var pictureSchema = new Schema({
  name: String,
  displayName: String,
  user: ObjectId,
  album: ObjectId,
  url: String,
  thumbUrl: String,
  updated: { type: Date, default: Date.now } 
});

var albumSchema = new Schema({
  user: ObjectId,
  title: {type: String, default: 'Untitled Album'},
  description: {type: String, default: ' '},
  updated: { type: Date, default: Date.now },
  sharedStatus: {type: String, default: 'private'},
  sharedEmails: [String]
});

var favouriteSchema = new Schema({
  user: ObjectId,
  picture: ObjectId,
  album: ObjectId
});
 
module.exports.Picture = mongoose.model('Picture', pictureSchema);
module.exports.Album = mongoose.model('Album', albumSchema);
module.exports.Favourite = mongoose.model('Favourite', favouriteSchema);