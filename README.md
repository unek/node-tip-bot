node-tip-bot is an open-source node.js IRC bot for tipping with altcoins. It uses [node-dogecoin](https://github.com/countable/node-dogecoin) for integration with Litecoin's JSON RPC API.

# Instalation
To install node-tip-bot simply clone this repo and install dependencies:
```bash
git clone https://github.com/unek/node-tip-bot
cd node-tip-bot
npm install
```
After installation proceed to the configuration.

# Configuration
To configure, copy the `config/config.sample.yml` file to `config/config.yml`.

## connection
IRC network connection info.
* **host** - hostname of the IRC server
* **port** - port of the IRC server
* **secure** - use secured connection
* **status_command** - NickServ command to get nick's login status, ACC on freenode, STATUS on some other networks

## login
IRC network connection and login info.
* **nickname** - bot's nickname
* **username** - bot's username
* **realname** - bot's realname
* **nickserv_password** - nickserv password to identify with

## channels
List of channels to auto-join to.

## webadmin
Web interface settings.
* **enabled** - enabled web admin
* **port** - port to bound to
* **users** - list of users with access to web interface in `name: password` format

## log
Logging settings.
* **file** - file to log to. Set to `false` to disable logging to file.

## rpc
JSON RPC API connection info.
* **host** - JSON RPC API hostname
* **port** - API port (by default 22555 for dogecoin)
* **user** - API username
* **pass** - API password (keep that secure)

## coin
Basic coin settings.
* **withdrawal_fee** - fee charged on withdraw to cover up txfee, the rest goes to bot's wallet.
* **min_withdraw** - minimum amount of coins to withdraw
* **min_confirmations** - minimum amount of confirmations needed to tip/withdraw coins
* **min_tip** - minimum amount of coins to tip
* **short_name** - short coin's name (eg. `Đ` or `DOGE`)
* **full_name** - full coin's name (eg. `dogecoin`)

## commands
Here you can restrict some commands to work only on PM/channel.

## messages
Whatever the bot says. Supports expandable variables (eg. `%nick%` for bot's nick). By default all config vars from `rpc` section are available.

# How does it work?
Every nickname has it's own account in your wallet. When tipping or withdrawing, bot checks if user is registered and identified with NickServ. If so, he moves the money from one account to another, or when withdrawing, transfers coins to other wallet.

# How to run it?
Before running the bot, you have to be running your coin daemon with JSON-RPC API enabled. To enable, add this to your coin daemon configuration file (eg. `~/.dogecoin/dogecoin.conf`):
```ini
server=1
daemon=1
rpcuser=<your username>
rpcpassword=<your super secret password>
rpcallowip=<your bot's ip address or just 127.0.0.1 if hosted on the same machine>
```

To run the bot simply use `node bin/tipbot` or `npm start`.

## Commands
Commands are executed by messaging the bot. Commands that have channel:true in the config can be run with '!<command>' in the channel.

| **Command** | **Arguments**     | **Description**
|-------------|-------------------|--------------------------------------------------------------------
| `balance`   |                   | displays your current wallet balance
| `address`   |                   | displays address where you can send your funds to the tip bot
| `withdraw`  | `<address>`       | withdraws your whole wallet balance to specified address
| `tip`       | `<nick> <amount>` | sends the specified amount of coins to the specified nickname
| `help`      |                   | displays configured help message (by default similiar to this one)
| `terms`     |                   | displays terms and conditions for using the tip bot
| `rain`      | <amount> [max]    | splits `amount` coins between `max` users on the channel

## Donations
Donations are welcome! If you like my bot and want to donate me, here are my wallet addresses:

* **Bitcoin**: 1G7T2JNDnbxo3txFWZSuV5oYq8qwtSEg51
* **Dogecoin**: DGLT1pTSKAXLSSSz1NGFgZNLioDyHdaDyA

or just tip me (unek) on freenode in your freshly installed tipbot :smile:
