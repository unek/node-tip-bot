var express = require('express')
, swig      = require('swig')
, path      = require('path');

module.exports.app = function(port, coin, settings, winston) {
  var app = express();

  app.use(express.static(path.join(__dirname, '/static')));
  app.use(express.basicAuth(function(user, password) {
    var success = settings.webadmin.users[user] == password;
    if(success)
      winston.info('%s logged into webadmin', user);
    else
      winston.warn('Failed webadmin login as %s', user);

    return success;
  }));

  var tpl = swig.compileFile(path.join(__dirname, '/views/index.html'));
  app.get('/', function(req, res) {
    var accounts = [];
    coin.listAccounts(5, function(err, balances) {
      if(err) {
        winston.error('Tried to get account listing but failed.', err);
        res.send(500, 'Could not get account list');
        return;
      }
      coin.listAccounts(0, function(err, unconfirmed_balances) {
        if(err) {
          winston.error('Tried to get account listing but failed.', err);
          res.send(500, 'Could not get account list');
          return;
        }
        var total = 0;
        var total_unconfirmed = 0;
        for(var user in balances) {
          if(user !== "")
            accounts.push({
              nick: user
            , balance: balances[user]
            , unconfirmed_balance: unconfirmed_balances[user] - balances[user]
            });
          total += balances[user];
          total_unconfirmed += unconfirmed_balances[user] - balances[user];
        };

        accounts.sort(function(a, b) {
          return b.balance - a.balance
        });

        var body = tpl({
          accounts: accounts
        , coin: settings.coin
        , total: total
        , total_unconfirmed: total_unconfirmed
        });

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', Buffer.byteLength(body));
        res.end(body);
      });
    });
  });

  app.get('/user/:user', function(req, res) {
    var user = req.params.user;
    coin.listReceivedByAddress(settings.coin.min_confirmations, true, function(err, reply) {
      if(err) {
        winston.error('Tried to get address listing but failed.', err);
        res.send(500, 'Could not get address list');
        return;
      }

      var addresses = [];
      for(var key in reply) {
        var address = reply[key];
        if(address.account.toLowerCase() == user.toLowerCase()) {
          addresses.push({address: address.address, amount: address.amount})
        }
      }

      var body = JSON.stringify({
        addresses: addresses
      });

      res.setHeader('Content-Type', 'text/json');
      res.setHeader('Content-Length', Buffer.byteLength(body));
      res.end(body);
    });

  });

  app.listen(port);
}
