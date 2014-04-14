$(document).ready(function(){
  $('#editAlbumButton').on('click', function(){
    $(this).attr('disabled', true).text('Please wait...');
    var title = $('#editAlbumTitle').val();
    if(!title) {
      alert('Please enter a title for your album!');
      $(this).attr('disabled', false).text('Save Changes');
      return;
    }
    var description = $('#editAlbumDescription').val();
    if(!description) {
      alert('Please enter a short description for your album!');
      $(this).attr('disabled', false).text('Save Changes');
      return;
    }

    var sharedStatus = 'private';
    if($('#albumIsPublic').is(':checked') === true) {
      sharedStatus = 'public';
    } else if($('#albumIsLogin').is(':checked') === true) {
      sharedStatus = 'loggedin';
    }

    var data = {
      id: $('#albumId').val(),
      title: title,
      description: description,
      sharedStatus: sharedStatus  
    };
    $.ajax({
      url : '/api/album',
      type: 'PUT',
      data: data,
      dataType: 'json',
      success: function(data, textStatus) {
        if(data.hasOwnProperty('_id')) {
          var pictureCount = $('#albumPicturesCount').text();
          var html = '' + data.title + '<br>';
          html += '<small>' + data.description + ', ';
          html += pictureCount + ' Photos, Last Updated on ';
          var date = new Date(data.updated);
          html += date.toDateString();
          $('#albumInfo').html(html);
          $('#albumInfoModal').html(html);
          $('#editAlbumTitle').val(data.title);
          $('#editAlbumDescription').val(data.description);
          if(data.sharedStatus === 'private') {
            $('#albumIsPrivate').attr('checked', true);
          } else if(data.sharedStatus === 'loggedin') {
            $('#albumIsLogin').attr('checked', true);
          } else if(data.sharedStatus === 'public') {
            $('#albumIsPublic').attr('checked', true);
          } else {
            // any error occurs, status defaults to private
            $('#albumIsPrivate').attr('checked', true);
          }
        } else {
          alert('Updating album failed!  Please try again.');
        }
        $('#editAlbumButton').attr('disabled', false).text('Save Changes');
        $('#edit-album-modal').modal('hide');
      },
      error: function(data, textStatus) {
        alert('Updating album failed. Please try again');
        $('#editAlbumButton').attr('disabled', false).text('Save Changes');
        $('#edit-album-modal').modal('hide');
        console.log('AJAX Error: ' + textStatus);
      }
    });
  });

  $('.sharedStatusRadios').change(function(){
    if($(this).val() === 'private') {
      $('#allowedEmailIds').fadeIn();
      $('#privateSharedEmailIds').fadeIn();
    } else {
      $('#allowedEmailIds').fadeOut();
      $('#privateSharedEmailIds').fadeOut();
    }
  });

  $('#newSharedEmailAddress').on('keypress', function(e){
    var ENTER_KEY = 13;
    if(e.keyCode !== ENTER_KEY) {
      return;
    }
    var email = $('#newSharedEmailAddress').val().trim();
    if(!email) {
      return;
    }
    $.ajax({
      url : '/api/album/emails',
      type: 'PUT',
      dataType: 'json',
      data: {
        email : email,
        album: $('#albumId').val()
      },
      beforeSend: function() {
        $('#newSharedEmailAddressLoading').show();
        $('#newSharedEmailAddress').attr('disabled', true);
        $('#editAlbumButton').attr('disabled', true);
      },
      success: function(data, textStatus) {
        if(typeof data.error !== 'undefined') {
          alert('Error: ' + data.error);
          return;  
        }
        $('#privateSharedEmailIds').append('<li>' + email + ' <a href="#" class="text-danger sharedEmailRemove" data-email="' + email +'">Remove</a></li>');
      },
      error: function(text) {
        alert('Adding email address to album failed! Please try again');
        console.log('Error:' + text);
      },
      complete: function() {
        $('#newSharedEmailAddressLoading').hide();
        $('#newSharedEmailAddress').attr('disabled', false).focus().val('');
        $('#editAlbumButton').attr('disabled', false);
      }
    });
  });

  $('#privateSharedEmailIds').on('click', 'a', function(e){
    e.preventDefault();
    var link = this;
    $.ajax({
      url : '/api/album/emails',
      type: 'DELETE',
      dataType: 'json',
      data: {
        email : $(link).data('email'),
        album: $('#albumId').val()
      },
      beforeSend: function() {
        $(link).html('<img src="/assets/img/loading-small.gif">');
      },
      success: function() {
        $(link).parent().remove();
      },
      error: function() {
        alert('Removing email from shared list failed. Please try again.');
        $(link).html('Remove');
      }
    });
  });

  $('#albumDeleteButton').on('click', function(e){
    e.preventDefault();
    var confirmation = confirm('This will delete the album and all of its pictures. Are you sure want to delete?');
    var deleteButton = $(this);
    $(deleteButton).attr('disabled', true);
    if(!confirmation) {
      deleteButton.attr('disabled', false);
      return;
    }
    $.ajax({
      url: '/api/album/',
      type: 'DELETE',
      dataType: 'json',
      data: {
        id: $('#albumId').val()
      },
      success: function(data, textStatus) {
        if(typeof data.success !== 'undefined') {
          window.location.href = '/home/';
        } else {
          $(deleteButton).attr('disabled', false);
          alert('There was some problem in deleteing the album. Please try again.');
        }
      },
      error: function() {
        alert('There was some problem in deleteing the album. Please try again.');
        $(deleteButton).attr('disabled', false);
      }
    });
  });

  $('.favouriteButton').on('click', function(e){
    e.preventDefault();
    var button = this;
    $(button).attr('disabled', true);
    var pictureId = $(button).data('pic-id');
    $.ajax({
      url: '/api/favourite',
      type: 'POST',
      dataType: 'json',
      data: { id: pictureId },
      success: function(data, textStatus) {
        if(typeof data.success === 'undefined') {
          alert('Sorry, we were unable to process your request. Please try again after some time.');
        } else {
          $(button).attr('disabled', false).removeClass('btn-warning').addClass('btn-success');
        }
      },
      error: function(textStatus) {
        console.log('Error: ' + textStatus);
        alert('Sorry, we were unable to process your request. Please try again after some time.');
        $(button).attr('disabled', false)
      }
    });
  });

  $('.deletePictureButton').on('click', function(e){
    e.preventDefault();
    var button = this;
    $(button).attr('disabled', true);
    var pictureId = $(button).data('picture-id');
    $.ajax({
      url: '/api/picture',
      type: 'DELETE',
      data: { id: pictureId },
      dataType: 'json',
      success: function(data, textStatus) {
        if(typeof data.success !== 'undefined') {
          var pictureCount = $('#albumPicturesCount').text();
          pictureCount = parseInt(pictureCount, 10);
          pictureCount -= 1;
          $('#albumPicturesCount').text(pictureCount);
          $(button).parent().parent().fadeOut();
          return;
        }
        $(button).attr('disabled', false);
        alert('Removing picture failed. Please try again');
        console.log(textStatus);
      },
      failure: function(textStatus) {
        $(button).attr('disabled', false);
        alert('Removing picture failed. Please try again');
        console.log(textStatus);
      }
    });
  });

});