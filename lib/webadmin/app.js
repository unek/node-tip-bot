var express = require('express')
, swig      = require('swig');

module.exports.app = function(port, coin, settings, winston) {
  var app = express();

  app.use(express.basicAuth(function(user, password) {
    var success = settings.users[user] == password;
    if(success)
      winston.info('%s logged into webadmin', user);
    else
      winston.warn('Failed webadmin login as %s', user);

    return success;
  }));

  var tpl = swig.compileFile(__dirname + '/views/index.html');
  app.get('/', function(req, res) {
    var accounts = [];
    coin.listAccounts(5, function(err, reply) {
      if(err) {
        winston.error('Tried to get account listing but failed.', err);
        res.send(500, 'Could not get account list');
        return;
      }
      for(var user in reply) {
        if(user !== "")
          accounts.push({nick: user, balance: reply[user]});
      };

      accounts.sort(function(a, b) {
        return b.balance - a.balance
      });

      var body = tpl({accounts: accounts});
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Length', Buffer.byteLength(body));
      res.end(body);
    });
  });

  app.listen(port);
}
