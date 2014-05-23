/**
 * Main application module.
 * Project started: 16.03.2014 - 00:21
 * @module app
 * @author Sören Gade
 *
 * @requires config
 * @requires web/index
 * @requires io/rfidreader
 * */

require('./log-replace')();
var package = require('../package');
var config = require('./config');
var web = require('./web/');
var RFIDReader = require('./io/rfidreader');
var Relais = require('./io/relais');
var db = require('./db/');

/* ==========
 * Globals
 * ==========
 * */
var rfidReader = null;
var relais = null;

/* ==========
 * Init
 * ==========
 * */
/**
 * Starts the webserver.
 * */
function startWeb() {
  var port = config.web.port;
  
  if(typeof PhusionPassenger !== 'undefined') {
    PhusionPassenger.configure({ autoInstall: false });
    port = 'passenger';
  }
  
  web.init(port, web_RFIDRequest, web_OpenDoor, function() {
    web.start(function() {
      console.log("Web interface running on port " + web.getPort() + ".");
    });
  });
}
// callbacks for web requests
function web_RFIDRequest(callback) {
  rfidReader.on('data', function(data) {
    callback(data);
  });
}
function web_OpenDoor(callback) {
  console.log("Opening door...");
  
  openDoor(callback);
}

/**
 * Initializes the connection with the RFID reader.
 * */
function initRFIDReader() {
  var port = config.port.rfid;
  if ( !port ) {
    console.log("Please set the rfidreader port in the config.");
    return;
  }
  
  // create new instance
  rfidReader = new RFIDReader(port);
  
  // add event listeners
  rfidReader.on('data', function(data) {
    data = data.toString();
    console.log("Data by RFID reader:", data);
    
    db.Card.find({
      where: {
        uid: data
      }
    }).success(function(card) {
      if ( !card ) {
        console.log("No card found.");
        
        // switch yellow off, red on
        relais.setSingle(config.relaisport.red, function(err) {
          relais.setSingle(config.relaisport.yellow, function(err) {
            
            setTimeout(function() {
              // switch yellow on, red off
              relais.delSingle(config.relaisport.red, function(err) {
                relais.delSingle(config.relaisport.yellow);
              });
            }, 1500);
          });
        });
      } else {
        console.log("Card found.");
        card.getUser().success(function(user) {
          if ( !user ) {
            console.log("no user found");
          } else {
            console.log("user is", user.username);
            
            openDoor(function(err) {
              if ( !!err ) {
                console.log("Error opening door:", err);
                return;
              }
              
              console.log("Door had been opened.");
            });
          }
        });
      }
    });
  });
  
  // open connection
  rfidReader.open(function(err) {
    if ( !!err ) {
      console.log("Error opening connection to rfid reader:", err);
    } else {
      console.log("Connection to RFID reader opened (" + port + ").");
    }
  });
}
/**
 * Initializes the connection with the relais card.
 * */
function initRelais() {
  var port = config.port.relais;
  if ( !port ) {
    console.log("Please set the relais card port in the config.");
    return;
  }
  
  relais = new Relais(port);
  
  relais.open(function(err) {
    if ( !!err ) {
      console.log("Error opening connection to relais card:", err);
    } else {
      relais.setup(function(err, ok) {
        if ( !!err ) {
          console.log("Error setting up relais card:", err);
        } else {
          if ( !ok ) {
            console.log("Could not open connection to relais card.");
          } else {
            console.log("Connection to relais card opened (" + port + ").");
            
            relais.deactivateAll();
          }
        }
      });
    }
  });
}

function openDoor(callback) {
  // TODO: Try out if it really works in real environments
  relais.setSingle(config.relaisport.door, function(err) {
    if ( !!err ) {
      console.log("Error opening the door:", err);
      return callback(err);
    }
    
    // switch green on, yellow off
    relais.setSingle(conig.relaisport.green, function(err) {
      relais.setSingle(config.relaisport.yellow);
    });
    
    setTimeout(function() {
      relais.delSingle(config.relaisport.door, function(err) {
        if ( !!err ) {
          console.log("Door could not be closed!");
          return callback(err);
        }
        
        // switch green off, yellow on
        relais.delSingle(conig.relaisport.green, function(err) {
          relais.delSingle(config.relaisport.yellow);
        });
        
        console.log("Door closed.");
        return callback(null);
      });
    }, config.web.doorOpenTime);
    
  });
}

if ( !module.parent || typeof PhusionPassenger !== 'undefined') {
  /**
   * The main application entry point.
   * */
  (function main() {
    console.log(package.name, "v" + package.version, "started.");
    
    initRFIDReader();
    initRelais();
    startWeb();
  }());
}

function exit(err) {
  if ( err ) {
    console.log("Unhandled Error:", err.stack);
  } else {
    console.log("Exiting...");
  }
  if ( rfidReader.isOpen ) {
    rfidReader.close();
  }
  if ( relais.isOpen ) {
    relais.close();
  }
  
  web.stop();
  
  // Done
  console.log("Bye!");
  // won't exit otherwise
  process.kill();
}
process.on('SIGINT', exit);
if ( process.env.NODE_ENV !== 'development' ) {
  process.on('exit', exit);
  process.on('uncaughtException', exit);
}
