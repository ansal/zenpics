$(document).ready(function(){
  $('#createAlbumButton').on('click', function(){
    $(this).attr('disabled', true).text('Please wait...');
    var title = $('#newAlbumTitle').val();
    if(!title) {
      alert('Please enter a title for your album!');
      $(this).attr('disabled', false).text('Create & Upload Images');
      return;
    }
    var description = $('#newAlbumDescription').val();
    if(!description) {
      alert('Please enter a short description for your album!');
      $(this).attr('disabled', false).text('Create & Upload Images');
      return;
    }
    var data = {
      title: title,
      description: description
    };
    $.ajax({
      url : '/api/album',
      type: 'POST',
      data: data,
      dataType: 'json',
      success: function(data, textStatus) {
        if(data.hasOwnProperty('_id')) {
          window.location.href = '/album/' + data._id;
        } else {
          alert('Creating album failed!');
        }
        $(this).attr('disabled', false).text('Create & Upload Images');
      },
      error: function(data, textStatus) {
        alert('Creating album failed. Please try again');
        console.log('AJAX Error: ' + textStatus);
        $(this).attr('disabled', false).text('Create & Upload Images');
      }
    });
  });
});