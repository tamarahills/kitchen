/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';
var express = require('express');
var port    =   process.env.PORT || 8080;
var UserMap = require('./user_map');
var Logger = require('./logger');
var Metrics = require('./metrics');
var bodyParser = require('body-parser');
let util = require('util');
let http = require('http');
var nconf = require('nconf');
let Bot = require('@kikinteractive/kik');
var app = express();
var users = new UserMap();
var logger = new Logger().getLogger();
// Use nconf to get the configuration for different APIs we are using.
nconf.argv()
   .env()
   .file({ file: './config.json' });

var metrics_logger = function() {
  var args = Array.from(arguments);
  logger.info(args.join(' '));
};
var options = {
  locale: 'en-us',
  os: 'AWS',
  os_version: 'AWS',
  device: 'AWS',
  app_name: 'smartkitchen',
  app_version: '1.0',
  app_update_channel: 'default',
  app_build_id: '1.0',
  app_platform: 'AWS',
  arch: 'node',
  logger: metrics_logger
};
/*
 * The list of metrics being sent are:
 *  "inventory", "get", "request", 1
 *  "inventory", "visual identify", "success", 1
 *  "inventory", "visual identify", "fail", 1
 *  "inventory", "barcode identify", "success", 1
 *  "inventory", "barcode identify", "fail", 1
 *  "meals", "request", "success", 1
 *  "recipe", "request", "success", 1
 */
var metrics = new Metrics('555666777888', options);

/* The simple smartkitchen kikbot grammar is as follows:
 * add <item> - adds item to the inventory
 * rm <item> - removes item from the inventory
 * get - returns a list of the users inventory to them in the bot
 * meals - returns a list of meals the user can cook with their inventory
 * y - confirms an item recognized
 * n - confirms that an item was NOT recognized
 * help - prints out the list of commands.
*/

var kik = nconf.get('kik');
// Configure the bot API endpoint, details for your bot
let bot = new Bot({
  username: kik.username,
  apiKey: kik.apiKey,
  baseUrl: kik.baseUrl
});

// This is a middleware statement and needs to stay here and not be rearranged.
app.use(bot.incoming(), function(req, res, next) {
  // It seems only the originalUrl is interesting, for now not logging the others.
  logger.info('originalUrl:', req.originalUrl);
/*
  logger.info(req.baseUrl);
  logger.info(req.path);
*/
  next();
});

// This is a middleware statement and needs to stay here and not be rearranged.
app.use('/item', function(req, res, next) {
  // It seems only the originalUrl is interesting, for now not logging the others.
  logger.info('originalUrl:', req.originalUrl); // '/admin/new'
/*
  logger.info(req.baseUrl); // '/admin'
  logger.info(req.path); // '/new'
*/
  next();
});

// This is a middleware statement and needs to stay here and not be rearranged.
bot.updateBotConfiguration();

// This is the first text message handler.  The logic for handling bot messages
// is you either reply() or call next() to go to the next handler in the chain.
// They are called sequentially so we have a catch-all at the end if the
// message is not part of the grammar.
bot.onTextMessage((message, next) => {
  // Check that it's an authenticated user (only need to check on first message)
  if (users.isUser(message.from)) {
    logger.info('Received a bot message from ' + message.from);
    if (message.type == 'text') {
      next();
    } else {
      message.reply('Text messages only, please');
    }
  } else {
    message.reply('Unauthorized');
    logger.info('Unauthorized user: ' + message.from);
  }
});

// Bot Handler for meals
bot.onTextMessage((message, next) => {
  if (message.body.toLowerCase().localeCompare('meals') == 0) {
    metrics.recordEvent('meals', 'request', 'success', 1, message.from);
    users.getMealsForUser(message.from, function(meals) {
      message.reply('Meals are: ' + meals);
    });
  } else {
    next();
  }
});

bot.onTextMessage((message, next) => {
  if (message.body.toLowerCase().localeCompare('y') == 0) {
    message.reply('Awesome! We are adding this to your inventory!');
    users.addCurrentItemToDB(message.from);
    metrics.recordEvent("inventory", "visual identify", "success", 1, message.from);
  } else {
    next();
  }
});

bot.onTextMessage((message, next) => {
  if (message.body.toLowerCase().localeCompare('n') == 0) {
    users.setStateByUser(message.from, 0);
    message.reply('Sorry about that!  You can enter the item manually by typing add <item> (e.g. \'add potato\')');
    metrics.recordEvent("inventory", "visual identify", "fail", 1, message.from);
  } else {
    next();
  }
});

bot.onTextMessage((message, next) => {
  var arrayOfStrings = message.body.toLowerCase().split(' ');
  // TODO: This is really needs to allow for a string with spaces (e.g. 'green pepper')
  if (arrayOfStrings.length >= 2) {
    logger.info(arrayOfStrings.join(' '));
    if (arrayOfStrings[0].toLowerCase().localeCompare('add') == 0) {
      var item = arrayOfStrings.slice(1).join(' ');
      logger.info('item: ', item);
      users.addItemToDB(message.from, item);
      message.reply('added ' + item);
    } else if (arrayOfStrings[0].toLowerCase().localeCompare('rm') == 0) {
      users.removeItemFromDB(message.from, arrayOfStrings[1], function() {
        message.reply('removed ' + arrayOfStrings[1]);
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

// Bot Handler for getting inventory ist
bot.onTextMessage((message, next) => {
  if (message.body.toLowerCase().localeCompare('get') == 0) {
    users.getInventory(message.from, function(list) {
      message.reply(list);
      metrics.recordEvent("inventory", "get", "request", 1, message.from);
    });
  } else {
    next();
  }
});

// This handler gets the recipe.  The user sends an index of the recipe they want
// The handler will return the recipe to the bot.
bot.onTextMessage((message, next) => {
  if (isNaN(message.body)) {
    next();
  } else {
    users.getRecipe(message.from, parseInt(message.body), function(recipe) {
      message.reply(recipe);
      metrics.recordEvent("recipe", "request", "success", 1, message.from);
    });
  }
});

bot.onTextMessage((message, next) => {
  if (message.body.toLowerCase().localeCompare('help') == 0) {
    message.reply('Try one of the following commands: \nadd <item> - adds item to the inventory. ' +
                '\nrm <item> - removes item from the inventory. ' +
                '\nget - returns a list of the users inventory to them in the bot. ' +
                '\nmeals - returns a list of meals you can cook with your inventory');
  } else {
    next();
  }
});

bot.onTextMessage((message, next) => {
  if (message.body.toLowerCase().localeCompare('trigger') == 0) {
    users.setStateByUser(message.from, 0);
    message.reply('Hey, is this a: potato?  Type (y)es or (n)o');
  } else {
    next();
  }
});

//This is the default handler
bot.onTextMessage((message, next) => {
  message.reply('Sorry, I didn\'t quite get that');
});

//TODO: This is not part of the real flow.  It's just a way to trigger the bot flow
// from the bot itself.  We can eventually remove this.
function triggerItemConfirmationFlow(item, user) {
  users.setStateByUser(user, 0);
  bot.send(Bot.Message.text('Hey, is this a: ' + item + '?.  Type (y)es or (n)o'), user);
}

// These need to be declared ahead of any of the post or get handlers.
app.use(bodyParser.json());

/*
 * The user has taken a picture, attempted to classify it with Watson or barcode
 * and we need to validate it with them.
 * fields for the post are:
 *  userid - the user's kik id
 *  item - the name of the item
 *  rec_method - barcode|visual
 */
app.post('/item',  function(req, res) {
  logger.info('got an item post');
  var deviceid = req.body.deviceid;
  var item = req.body.item;
  var type = req.body.rec_type || 'visual';
  logger.info('deviceid: ' + deviceid + '. item: ' + item);
  if (users.isDevice(deviceid)) { //TODO:  Check for undefined
    var userid = users.getUserid(deviceid);
    logger.info('user for device id ' + deviceid + ': ' + userid);
    users.setStateByUser(userid, 0);
    if (item.localeCompare('NoResults') == 0) {
      bot.send(Bot.Message.text('Sorry, nothing was recognized.  Try again and ' +
                                'adjust the lighting, hold the camera still, and aim it ' +
                                'directly at the object with no background objects.'), userid);
    } else {
      bot.send(Bot.Message.text('Hey, is this a(n): ' + item + '?  Type (y)es or (n)o'), userid);
      //Save the current item with the user so we can come back to it later once it's confirmed.
      users.setCurrentItem(userid, item);
    }
    res.status(200).send('OK');
  } else {
    logger.info('User not found.');
    res.status(401).send('Unauthorized');
  }
});

// Default handlers in case anyone comes to the landing pages.
app.get('/', function(req, res) {
  res.send('This is a KikBot Server.  Look for the smartkitchen bot in the bot store.');
});

app.get('/about', function(req, res) {
  res.send('This is a KikBot Server.  Look for the smartkitchen bot in the bot store.');
});

// Start the server listening.
app.listen(process.env.PORT || 8080, function() {
	logger.info('Server started on port ' + (process.env.PORT || 8080));
});
