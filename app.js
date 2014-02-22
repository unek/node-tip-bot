var irc    = require('irc')
, winston  = require('winston')
, fs       = require('fs')
, yaml     = require('js-yaml')
, coin     = require('node-dogecoin');

// load winston's cli defaults
winston.cli();

// load settings
var settings = yaml.load(fs.readFileSync("./config.yml", "utf-8"));

// connect to coin json-rpc
winston.info('Connecting to coind...');

var coin = coin({
  host: settings.rpc.host
, port: settings.rpc.port
, user: settings.rpc.user
, pass: settings.rpc.pass
});

coin.getBalance(function(err, balance) {
  if(err) {
    winston.error('Could not get %s wallet balance! ', settings.coin.full_name, err);
    process.exit();
    return;
  }

  var balance = typeof(balance) == 'object' ? balance.result : balance;
  winston.info('Connected to JSON RPC API. Current total balance is %d' + settings.coin.short_name, balance);
})

// connect to the server
winston.info('Connecting to the server...');

var client = new irc.Client(settings.connection.host, settings.login.nickname, {
  port:   settings.connection.port
, secure: settings.connection.secure

, channels: settings.channels
, userName: settings.login.username
, realName: settings.login.realname
});

// gets user's login status
irc.Client.prototype.getLoginStatus = function(nickname, callback) {
  // request login status
  this.say('NickServ', 'ACC ' + nickname);

  // wait for response
  var listener = function(from, to, message) {
   // proceed only on NickServ's ACC response
    if(from != undefined && from.toLowerCase() == 'nickserv' && /^(\S+) ACC (\d)/.test(message)) {
      var match = message.match(/^(\S+) ACC (\d)/);
      var user  = match[1];
      var level = match[2];

      // if the right response, call the callback and remove this listener
      if(user.toLowerCase() == nickname.toLowerCase()) {
        callback(Number(level));
        this.removeListener('notice', listener);
      }
    }
  }

  this.addListener('notice', listener);
}

// gets a empty coin address
irc.Client.prototype.getAddress = function(nickname, callback) {
  winston.debug('Requesting address for %s', nickname);
  coin.send('getaccountaddress', nickname.toLowerCase(), function(err, address) {
    if(err) {
      winston.error('Something went wrong while getting address. ' + err);
      callback(err);

      return false;
    }

    callback(false, address);
  });
}

String.prototype.expand = function(values) {
  var global = {
    nick: client.nick
  }
  return this.replace(/%([a-zA-Z_]+)%/g, function(str, variable) {
    return values[variable] || settings.coin[variable] || global[variable]
  });
}

// basic handlers
client.addListener('registered', function(message) {
  winston.info('Connected to %s.', message.server);
});

client.addListener('error', function(message) {
  winston.error('Received an error from IRC network: ', message);
});

client.addListener('message', function(from, channel, message) {
  winston.info('[%s] <%s> %s', channel, from, message);
  if(/^!tip/.test(message)) {
    var match  = message.split(' ');
    if(match.length < 3) {
      client.say(channel, 'Usage: !tip <nickname> <amount>')
      return;
    }
    var to     = match[1];
    var amount = Number(match[2]);

    client.getLoginStatus(from, function(status) {
      // check if the sending user is logged in (identified)
      if(status == 3) {
          // check balance with min. 5 confirmations
          coin.getBalance(from, settings.coin.min_confirmations, function(err, balance) {
          if(err) {
            winston.error('Error in !tip command: %s', err);
            client.say(channel, settings.messages.error.expand({name: from}));
            return;
          }
          var balance = typeof(balance) == 'object' ? balance.result : balance;

          if(balance >= amount) {
            client.getAddress(to, function(err, to_address) { // get the address to actually create a new one
              if(err) {
                winston.error('Error in !tip command: %s', err);
                client.say(channel, settings.messages.error.expand({name: from}));
                return;
              }

              coin.send('move', from.toLowerCase(), to.toLowerCase(), amount, function(err, reply) {
                if(err || !reply) {
                  winston.error('Error in !tip command: %s', err);
                  client.say(channel, settings.messages.error.expand({name: from}));
                  return;
                }

                winston.info("%s tipped %s %d%s", from, to, amount, settings.coin.short_name)
                client.say(channel, settings.messages.tipped.expand({from: from, to: to, amount: amount}));
              });
            })
          } else {
            winston.info('%s tried to tip %s %d, but has only %d', from, to, amount, balance);
            client.say(channel, settings.messages.no_funds.expand({name: from, balance: balance, short: amount - balance, amount: amount}));
          }
        })
      } else {
        client.say(channel, settings.messages.not_identified.expand({name: from}));
      }
    });
  }
  if(/^!address/.test(message)) {
    var params = message.split(' ');
    var user   = params[1] || from;
    client.getAddress(user, function(err, address) {
      if(err) {
        winston.error('Error in !address command: %s', err);
        client.say(channel, settings.messages.error.expand({name: from}));
        return;
      }

      client.say(channel, settings.messages.expand({name: user, address: address}));
    });
  }

  if(/^!balance/.test(message)) {
    var params = message.split(' ');
    var user   = (params[1] || from).toLowerCase();
    coin.getBalance(user, settings.coin.min_confirmations, function(err, balance) {
      if(err) {
        winston.error('Error in !balance command: %s', err);
        client.say(channel, settings.messages.error.expand({name: from}));
        return;
      }

      var balance = typeof(balance) == 'object' ? balance.result : balance;

      coin.getBalance(user, 0, function(err, unconfirmed_balance) {
      if(err) {
          winston.error('Error in !balance command: %s', err);
          client.say(channel, settings.messages.balance.expand({balance: balance, name: user}));
          return;
        }

        var unconfirmed_balance = typeof(unconfirmed_balance) == 'object' ? unconfirmed_balance.result : unconfirmed_balance;
        client.say(channel, settings.messages.balance.expand({balance: balance, name: user, unconfirmed: unconfirmed_balance - balance}));
      })
    });
  }

  if(/^!withdraw/.test(message)) {
    var match = message.match(/^!withdraw (.*)$/);
    if(match == null) {
      client.say(channel, 'Usage: !withdraw <' + settings.coin.full_name + ' address>');
      return;
    }
    var address = match[1];

    coin.validateAddress(address, function(err, reply) {
      if(err) {
        winston.error('Error in !withdraw command: %s', err);
        client.say(channel, settings.messages.error.expand({name: from}));
        return;
      }

      if(reply.isvalid) {
        coin.getBalance(from.toLowerCase(), settings.coin.min_confirmations, function(err, balance) {
          if(err) {
            winston.error('Error in !withdraw command: %s', err);
            client.say(channel, settings.messages.error.expand({name: from}));
            return;
          }
          var balance = typeof(balance) == 'object' ? balance.result : balance;

          if(balance <= settings.coin.min_withdraw) {
            winston.warn('%s tried to withdraw %d, but min is set to %d', from, balance, settings.coin.min_withdraw);
            client.say(channel, settings.messages.withdraw_too_small.expand({from: from, balance: balance}));
            return;
          }

          coin.sendFrom(from.toLowerCase(), address, balance - settings.coin.withdrawal_fee, function(err, reply) {
            if(err) {
              winston.error('Error in !withdraw command: %s', err);
              client.say(channel, settings.messages.error.expand({name: from}));
              return;
            }

            client.say(channel, settings.messages.withdraw_success.expand({name: from, address: address, balance: balance, amount: balance - settings.coin.withdrawal_fee, transaction: reply}));
            client.say(channel, settings.messages.withdraw_success2.expand({name: from, address: address, balance: balance, amount: balance - settings.coin.withdrawal_fee, transaction: reply}));

            // transfer the rest (usually withdrawal fee - txfee) to the master account
            coin.getBalance(from.toLowerCase(), function(err, balance) {
              if(err) {
                winston.error('Something went wrong while transferring fees', err);
                return;
              }

              var balance = typeof(balance) == 'object' ? balance.result : balance;
              coin.move(from.toLowerCase(), settings.rpc.master_account, balance, function(err) {
                if(err) {
                  winston.error('Something went wrong while transferring fees', err);
                  return;
                }
              });
            });
          });
        });
      } else {
        winston.warn('%s tried to withdraw to an invalid address', from);
        client.say(channel, settings.messages.invalid_address.expand({address: address, name: from}));
      }
    });
  }
});

client.addListener('notice', function(from, to, message) {
  if(to == '*') return false;
  winston.info('NOTICE: [%s] <%s> %s', to, from, message);
});

client.addListener('selfMessage', function(to, message) {
  winston.info('[%s] <%s> %s', to, this.nick, message);
});