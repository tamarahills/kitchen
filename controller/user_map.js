var mysql = require('promise-mysql');
var https = require('https');
var nconf = require('nconf');
var Logger = require('./logger');

var logger = new Logger().getLogger();

function UserMap() {
  var self = this;
  this.map = new Map();
  this.deviceMap = new Map();
  this.recipeMap = new Map();
  // Use nconf to get the configuration for different APIs we are using.
  nconf.argv()
     .env()
     .file({ file: './config.json' });
  this.bigOvenApiKey = nconf.get('bigOvenApiKey');

  var db = nconf.get('db');
  this.pool = mysql.createPool({
    connectionLimit : 10,
    host     : db.host,
    port     : db.port,
    user     : db.user,
    password : db.password,
    database : db.database
  });

  var connection = this.pool.getConnection();
  this.pool.query('SELECT userid, deviceid FROM Profile').then(function(rows) {
    logger.info('result:length:' + rows.length);
    for (var i in rows) {
      logger.info('result:' + rows[i].userid + ', ' + rows[i].deviceid);
      var json = {
        state: 0,
        currentItem: 'none'
      };
      self.map.set(rows[i].userid, json);
      self.deviceMap.set(rows[i].deviceid, rows[i].userid);
    }
    logger.info('map size: ' + self.map.size);
  });
}

UserMap.prototype.getStateByUser = function(user) {
  var self = this;
  if (self.map.has(user)) {
    logger.info('Found user: ' + user);
    return self.map.get(user).state;
  } else {
    return 'nosuchuser';
  }
};

UserMap.prototype.setStateByUser = function(user, state) {
  var self = this;
  if (self.map.has(user)) {
    logger.info('Found user: ' + user);
    var data = self.map.get(user);
    data.state = state;
    self.map.set(user, data);
  }
};

UserMap.prototype.isUser = function(user) {
  if (this.map.has(user)) {
    return true;
  }
  return false;
}

UserMap.prototype.isDevice = function(device) {
  if (this.deviceMap.has(parseInt(device))) {
    return true;
  }
  logger.info('device not found: ' + device);
  return false;
}

UserMap.prototype.getUserid = function(device) {
  var deviceid = parseInt(device);
  if (this.deviceMap.has(deviceid)) {
    return this.deviceMap.get(deviceid);
  }
  return 'nosuchuser';
}

UserMap.prototype.setCurrentItem = function(user, item) {
  var self = this;
  if (self.map.has(user)) {
    logger.info('Found user: ' + user);
    var data = self.map.get(user);
    data.currentItem = item;
    self.map.set(user, data);
    logger.info('setCurrentItem:' + user +':' + item);
  }
}

UserMap.prototype.getCurrentItem = function(user) {
  var self = this;
  if (self.map.has(user)) {
    var data = self.map.get(user);
    logger.info('GetCurrentItem: ' + user + 'currentItem: ' + data.currentItem);
    return data.currentItem;
  } else {
    logger.info('user not found:' + user);
  }
}

UserMap.prototype.addCurrentItemToDB = function(user) {
  var self = this;
  var item = self.getCurrentItem(user);
  var queryString = 'INSERT INTO Inventory VALUES (' + '\'' + user +'\',\'' +
    item + '\')';
  logger.info('QueryString: ' + queryString);
  this.pool.query(queryString, function (error, results, fields) {
    if (error) {
      logger.error(error);
    } else {
      logger.info(item + ' inserted');
    }
  });
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.addItemToDB = function(user, item) {
  var self = this;
  var queryString = 'INSERT INTO Inventory VALUES (' + '\'' + user +'\',\'' +
    item + '\')';
  logger.info('QueryString: ' + queryString);
  this.pool.query(queryString, function (error, results, fields) {
    if (error) {
      logger.info(error);
    } else {
      logger.info(item + ' inserted');
    }
  });
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.removeItemFromDB = function(user, item, done) {
  var self = this;
  var queryString = 'DELETE FROM Inventory WHERE userid=' +'\'' + user +
    '\' AND ingredient=' + '\'' + item + '\'';
  logger.info('QueryString: ' + queryString);
  this.pool.query(queryString).then(function(error) {
    if (error) {
      logger.info(error);
    } else {
      logger.info(item + ' deleted');
    }
    done();
  });
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.getInventory = function(user, done) {
  var self = this;
  var queryString = 'SELECT ingredient FROM Inventory WHERE userid=' +'\'' + user +'\'';
  logger.info('QueryString: ' + queryString);
  this.pool.query(queryString).then(function(rows) {
    logger.info('result:length:' + rows.length);
    var list = '';
    for (var i in rows) {
      list = list.concat('\n' + rows[i].ingredient);
    }
    logger.info('Inventory: ' + list);
    done(list);
  });
}

UserMap.prototype.getMealsForUser = function(user, done) {
  var self = this;
  // Clear out any previous meals search:
  self.recipeMap.delete(user);
  // Order the ingredients randomly so we can call 'meals' multiple times and get
  // different results.  We can only pass 3 ingredients.
  var queryString = 'SELECT ingredient FROM Inventory WHERE userid=' +'\'' + user +'\' ORDER BY RAND() LIMIT 3';
  logger.info('QueryString: ' + queryString);
  this.pool.query(queryString).then(function(rows) {
    if (rows.length == 0) {
      done('You have no inventory.  Try adding some items to your inventory');
    } else {
      var params = '&include_primarycat=maindish,sidedish,appetizers&include_ing=';
      var i = 0;
      while (i < 3 && i < rows.length) {
        params = params.concat(encodeURIComponent(rows[i].ingredient));
        logger.info(rows[i].ingredient);
        i++;
        if (i < 3 && i < rows.length) {
          params = params.concat(',');
        }
      }
      params = params.concat('&api_key=' + self.bigOvenApiKey);

      logger.info('Params are: ' + params);

      var options = {
        host: 'api2.bigoven.com',
        path: '/recipes?pg=1&rpp=20' + params,
        port: 443,
        method: 'GET'
      };

      logger.info('Path: ' + options.path);

      https.get(options, function(res) {
        var data = '';
        logger.info('STATUS: ' + res.statusCode);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          data += chunk;
        });

        res.on('end',function(){
          var obj = JSON.parse(data);
          var recipeList = '';
          if (obj.Results.length == 0) {
            done('No recipes found');
          } else {
            var recipes = [];
            for (var i = 0; i < obj.Results.length; i++) {
              recipes.push(obj.Results[i].RecipeID);
              recipeList = recipeList.concat(i + '. ' + obj.Results[i].Title + '\n');
              logger.info(obj.Results[i].Title);
            }
            self.recipeMap.set(user, recipes);
            done('Recipes:\n' + recipeList);
          }
        });
      })
    }
  });
}

UserMap.prototype.getRecipe = function(user, recipeIndex, done) {
  var self = this;

  if (self.recipeMap.has(user)) {
    var userRecipeArray = self.recipeMap.get(user);
    if (recipeIndex > userRecipeArray.length) {
      done('Recipe Index not found');
    } else {
      var recipeId = userRecipeArray[recipeIndex];
      logger.info('RecipeIndex: ' + recipeIndex);
      logger.info('RecipeID: ' + recipeId);
      var options = {
        host: 'api2.bigoven.com',
        path: '/recipe/' + recipeId + '?api_key=' + self.bigOvenApiKey,
        port: 443,
        method: 'GET'
      };

      logger.info('Path: ' + options.path);

      https.get(options, function(res) {
        var data = '';
        logger.info('STATUS: ' + res.statusCode);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          data += chunk;
        });

        res.on('end', function() {
          var obj = JSON.parse(data);
          var recipeReturned = obj.Title + '\nIngredients:\n';
          for (var i = 0; i < obj.Ingredients.length; i++) {
            logger.info('Ingredient:' + obj.Ingredients[i].Name);
            recipeReturned = recipeReturned.concat(obj.Ingredients[i].Name + '\n');
          }
          recipeReturned = recipeReturned.concat('Directions: ' + obj.WebURL);
          done(recipeReturned);
        });
      })
    }
  } else {
    done('You must request recipes first.');
  }
}

module.exports = UserMap;
