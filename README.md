# node-tip-bot
node-tip-bot is an open-source node.js IRC bot for tipping with altcoins. It uses [node-dogecoin](https://github.com/countable/node-dogecoin) for integration with Litecoin's JSON RPC API.

## Instalation
To install node-tip-bot simply clone this repo and install dependencies:
```bash
git clone https://github.com/unek/node-tip-bot
cd node-tip-bot
npm install
```
After installation proceed to the configuration.

## Configuration
To configure, edit the config/config.yml file.
### connection
IRC network connection info.
* **host** - hostname of the IRC server
* **port** - port of the IRC server
* **secure** - use secured connection
* **status_command** - NickServ command to get nick's login status, ACC on freenode, STATUS on some other networks
### login
IRC network connection and login info.
* **nickname** - bot's nickname
* **username** - bot's username
* **realname** - bot's realname
* **nickserv_password** - nickserv password to identify with
### channels
List of channels to auto-join to.
### log
Logging settings.
* **file** - file to log to. Set to `false` to disable logging to file.
### rpc
JSON RPC API connection info.
* **host** - JSON RPC API hostname
* **port** - API port (by default 22555 for dogecoin)
* **user** - API username
* **pass** - API password (keep that secure)
### coin
Basic coin settings.
* **withdrawal_fee** - fee collected on withdraw to cover up txfee, the rest goes to bot's wallet.
* **min_withdraw** - minimum amount of coins to withdraw
* **min_confirmations** - minimum amount of confirmations needed to tip/withdraw coins
* **min_tip** - minimum amount of coins to tip
* **short_name** - short coin's name (eg. `Đ` or `DOGE`)
* **full_name** - full coin's name (eg. `dogecoin`)
### commands
Here you can restrict some commands to work only on PM/channel.
### messages
Whatever the bot says. Supports expandable variables (eg. `%nick%` for bot's nick). By default all config vars from `rpc` section are available.

## How does it work?
Every nickname has it's own account in your wallet. When tipping or withdrawing, bot checks if user is registered and identified with NickServ. If so, he moves the money from one account to another, or when withdrawing, transfers coins to other wallet.

## How to run it?
To run the bot simply use `npm start` or `node bin/tipbot`.

## Commands

| **Command** | **Arguments**     | **Description**
|-------------|-------------------|--------------------------------------------------------------------
| `balance`   |                   | displays your current wallet balance
| `address`   |                   | displays address where you can send your funds to the tip bot
| `withdraw`  | `<address>`       | withdraws your whole wallet balance to specified address
| `tip`       | `<nick> <amount>` | sends the specified amount of coins to the specified nickname
| `help`      |                   | displays configured help message (by default similiar to this one)

## Donations
Donations are welcome! If you like my bot and want to donate me, here are my wallet addresses:

* **Dogecoin**: DGLT1pTSKAXLSSSz1NGFgZNLioDyHdaDyA

## License
(The MIT License)

Copyright (c) 2014 unek <unekpl@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
