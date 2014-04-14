var fs = require('fs');
// use subclass for imagemagick
// see http://stackoverflow.com/a/19252318
var gm = require('gm').subClass({ imageMagick: true });
var AWS = require('aws-sdk');
// load the AWS SDK from file
AWS.config.loadFromPath('awsconfig.json');

// resize an image. this is an internal function. please -
// export other high level functions for exporting
exports.resizeImage = function(src, dest, width, height, callback){
  gm(src)
  .resize(width, height)
  .write(dest, callback);
};

// send an image (or a file to s3)
// by default all files are private
exports.sendfiletoS3 = function(bucket, folder, name, path, callback) {
  var s3 = new AWS.S3();
  s3.client.createBucket({Bucket: bucket}, function() {
    fs.readFile(path, function(err, fileBuffer){
      folder = bucket + '/' + folder;
      var data = {Bucket: folder, Key: name, Body: fileBuffer};
      s3.client.putObject(data, callback);
    });
  });
};

// Get a signed URL for an object for getOperations
exports.getSignedURL = function(params) {
  var s3 = new AWS.S3();
  return s3.getSignedUrl('getObject', params);
}

/*
// test uploading to S3
sendfiletoS3('zenpics', 'abrakadabra', 'magic2.jpg', '/home/ansal/Desktop/as.jpg', function(err){
  if(err) {
    console.log('Error: ' + err);
  } else {
    console.log('file uploaded successfully');
  }
});
*/