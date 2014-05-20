/*
 * Routes that render html or redirect to html rendering pages.
 * */

var fs = require('fs');

var helpers = require('./helpers');
var pkg = require('./../../../package');
var db = require('./../../db/');

var availableLanguages = fs.readdirSync(__dirname + '/../public/js/languages');

for(var i = 0; i < availableLanguages.length; i++)
  availableLanguages[i] = availableLanguages[i].split(".")[0];

/* Default route: Login */
exports.index = function(req, res) {
  helpers.validateAuthenticatedRequest(req, function(ok) {
    
    if ( ok ) {
      res.redirect("/app");
    } else {
      
      res.render('index', {
        title: pkg.name
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
        title: pkg.name
      });
    }
    
  });
};

/* Special stuff for i18n */
exports.i18n = function(req, res) {
  var language = req.acceptsLanguage(availableLanguages);
  
  res.set('Content-Type', 'text/javascript');
  fs.createReadStream(__dirname + '/../public/js/languages/' + language + '.js').pipe(res);
};

exports.logout = function(req, res) {
  req.logout();
  
  res.redirect('/');
};

/* Initial setup route */
exports.setup = function(req, res) {
  db.User.count().complete(function(err, count) {
    if ( err || count ) {
      res.redirect('/');
    } else {
      
      // if no entries are in the db, then we want the setup
      var config = require('./../../config');
      if ( !req.session.setupCode || req.session.setupCode !== config.setupCode ) {
        // authenticate with setup code
        res.render('setup/authenticate', {
          title: pkg.name
        });
      } else {
        // set preferences
        res.render('setup/setup', {
          title: pkg.name
        });
      }
      
    }
  });
};
