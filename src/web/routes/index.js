/*
 * Routes that render html or redirect to html rendering pages.
 * */

var helpers = require('./helpers');

/* Default route: Login */
exports.index = function(req, res) {
  helpers.validateAuthenticatedRequest(req, function(ok) {
    
    if ( ok ) {
      res.redirect("/app");
    } else {
      res.render('index', {
        title: 'hgots-node'
      });
    }
    
  });
};

/* Default route: App */
exports.app = function(req, res) {
  helpers.validateAuthenticatedRequest(req, function(ok) {
    
    if ( !ok ) {
      res.redirect('/');
    } else {
      res.render('app', {
        title: 'hgots-node'
      });
    }
    
  });
};
exports.logout = function(req, res) {
  req.logout();
  
  res.redirect('/');
};
