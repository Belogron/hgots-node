var assert = require('assert');
var db = require('../../../../db/');

exports.db = db;

exports.getAllUsers = function(callback) {
  db.User.findAll().complete(callback);
};
exports.getUser = function(where, callback) {
  db.User.find({
    where: where
  }).complete(callback);
};

exports.createUser = function(data, callback) {
  db.User.create(data).complete(callback);
};
exports.updateUser = function(id, data, callback) {
  // prevent 'undefined' values:
  db.User.find({
    where: {
      id: id
    }
  }).complete(function(err, user) {
    if ( err ) {
      callback(err);
    } else {
      user.username = data.username || user.username;
      user.password = data.password || user.password;
      user.type = data.type || user.type;
      
      user.save().complete(function(err) {
        callback(err, user);
      });
    }
  });
};

exports.deleteUserObject = function(user, callback) {
  user.destroy().complete(callback);
};

/* Helpers for the API */
exports.getRequestingUser = function(req, callback) {
  assert(callback, "Callback must be defined.");
  
  callback(null, req.user);
};


exports.sendPublicUser = function(res, user) {
  assert(!!res, "Response object must be given.");
  assert(!!user, "User object must be given.");
  
  var publicUser = user.getPublicModel();
  
  res.set('Content-Type', 'application/json').end(JSON.stringify(publicUser));
};
