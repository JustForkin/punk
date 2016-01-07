var React = require('react');
var ReactDOM = require('react-dom');
var vapor = require('vapor');

var Loader = require('./components/loader.js');
var Login = require('./components/login.js');

var Storage = require('./storage.js');
var plugins = require('./plugins');

var CURRENT_USER = 'user.json';

function Punk() {
  this.client = vapor();
}

Punk.prototype.start = function() {
  var self = this;

  Storage.get(CURRENT_USER, function(error, data) {
    if(error) {
      // assume the file does not exist
      ReactDOM.render(<Login />, document.getElementById('app'));
    } else {
      try {
        var user = JSON.parse(data);
      } catch(e) {
        // ignore the data
        ReactDOM.render(<Login />, document.getElementById('app'));
        return;
      }

      var loginKeyFileName = user.username + '-loginkey';
      var options = {
        username: user.username,
        password: user.password
      };

      Storage.get(loginKeyFileName, function(error, loginKey) {
        if(!error) {
          options.loginKey = loginKey.toString();
        }

        ReactDOM.render(<Loader message="Connecting..."/>, document.getElementById('app'));

        self.init(options, function() {
          self.loadPlugins();
          self.connect();
        });
      });
    }
  });
};

Punk.prototype.init = function(options, next) {
  var self = this;

  Storage.get('servers.json', function(error, data) {
    if(error) {
      console.log('Failed to load server list from cache. Falling back to built-in cache...');
    } else {
      var servers;
      try {
        servers = JSON.parse(data);
      } catch(e) {
        // ignore
      }

      if(servers) {
        self.client.servers = servers;
      }

      self.client.init(options);
      next();
    }
  });
};

Punk.prototype.loadPlugins = function() {
  // load these 3 plugins ASAP (order matters)
  this.client.use(vapor.plugins.consoleLogger);
  this.client.use(vapor.plugins.essentials);
  this.client.use(plugins.file);

  this.client.use(plugins.messageDumper);
  this.client.use(plugins.steamGuard);
  this.client.use(plugins.ready);
  this.client.use(plugins.personaState);
  this.client.use(plugins.friendMsg);
  this.client.use(plugins.loginKey);
  this.client.use(plugins.logout);
  this.client.use(plugins.presence);
  this.client.use(plugins.friends);
  this.client.use(plugins.notifications);
  this.client.use(plugins.cookies);
  this.client.use(plugins.disconnected);
  this.client.use(plugins.offlineMessages);
  this.client.use(plugins.trade);
};

Punk.prototype.connect = function() {
  this.client.connect();
};

module.exports = Punk;
