/*
 * Public pages
 */

exports.index = function(req, res){
  if(!req.user) {
    res.render('pages');
  } else {
    res.redirect('/home');
  }
};