function processNextFileInQueue() {
  $('#fileUploadProgressBarValue').css('width', '0');
  $('#fileUploadProgressBar').fadeIn();
  if(window.ZenPics.totalUploaded >= window.ZenPics.uploadFiles.length) {
    $('#fileUploadProgressBar').fadeOut();
    window.location.reload();
    return;
  }
  uploadImage(window.ZenPics.uploadFiles[window.ZenPics.totalUploaded], $('#albumId').val());
  $('#totalUploadedFilesCount').text(window.ZenPics.totalUploaded);
  $('#totalSelectedFilesCount').text(window.ZenPics.uploadFiles.length);
  $('#currentUploadFileTitle').text(window.ZenPics.uploadFiles[window.ZenPics.totalUploaded].name);
}
function uploadImage(file, album) {
  if(! file.type.match('image.*')) {
    window.ZenPics.totalUploaded++;
    processNextFileInQueue();
    return;
  }
  var formData = new FormData();
  formData.append('image', file);
  formData.append('album', album); 
  var xhr = new XMLHttpRequest();
  
  xhr.upload.onprogress = function(e) {
    if (e.lengthComputable) {
      var percentage = (e.loaded / e.total) * 100;
      $('#fileUploadProgressBarValue').css('width', percentage + '%');
    }
  };
  
  xhr.onerror = function(e) {
    $('#fileUploadProgressBar').fadeOut();
    console.log('Uploaded failed for ' + e);
    window.ZenPics.totalUploaded++;
    processNextFileInQueue();
  };
  
  xhr.onload = function() {
    $('#fileUploadProgressBar').fadeOut();
    window.ZenPics.totalUploaded++;
    processNextFileInQueue();
  };
  
  xhr.open('post', '/api/picture', true);
  xhr.send(formData);
}

$(document).ready(function(){
  $('#imagesToUpload').on('change', function(e){
    var uploadImagesPreview = $('#uploadImagesPreview');
    $(uploadImagesPreview).html('');
    window.ZenPics = {
      uploadFiles: files,
      totalUploaded: 0
    };
    var files = e.target.files;
    for(var i = 0; i < files.length; i++) {
      if(! files[i].type.match('image.*')) {
        continue;
      }
      var reader = new FileReader();
      reader.onload = (function(theFile) {
        return function(e) {
          var html = [
            '<span>',
              '<img class="uploadImagesThumb" src="' + e.target.result + '">',
            '</span>'
          ]; 
          $(uploadImagesPreview).append(html.join(''));
        };
      })(files[i]);
      reader.readAsDataURL(files[i]);
    }
  });
  $('#uploadPicturesButton').on('click', function(e){
    $(this).attr('disabled', true);
    var files = $('#imagesToUpload').prop('files');
    var album = $('#albumId').val();
    if(files.length <= 0) {
      return;
    }
    window.ZenPics = {
      uploadFiles: files,
      totalUploaded: 0
    };
    processNextFileInQueue();
  });
});