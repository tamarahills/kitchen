var mysql = require('promise-mysql');
var https = require('https');
var OVEN_KEY = '{Your key here}';

function UserMap() {
  var self = this;
  this.map = new Map();
  this.recipeMap = new Map();
  this.pool = mysql.createPool({
    connectionLimit : 10,
    host     : "<my sql instance hostname here>",
    port     : 3306,
    user     : "<your user here",
    password : "<your password here",
    database : "kitchen"
  });

  var connection = this.pool.getConnection();
  this.pool.query('SELECT userid FROM Profile').then(function(rows) {
    console.log('result:length:' + rows.length);
    for (var i in rows) {
      console.log('result:' + rows[i].userid);
      var json = {
        state: 0,
        currentItem: 'none'
      };
      self.map.set(rows[i].userid, json);
    }
    console.log('map size: ' + self.map.size);
  });
}

UserMap.prototype.getStateByUser = function(user) {
  var self = this;
  if (self.map.has(user)) {
    console.log('Found user: ' + user);
    return self.map.get(user).state;
  } else {
    return 'nosuchuser';
  }
};

UserMap.prototype.setStateByUser = function(user, state) {
  var self = this;
  if (self.map.has(user)) {
    console.log('Found user: ' + user);
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

UserMap.prototype.setCurrentItem = function(user, item) {
  var self = this;
  if (self.map.has(user)) {
    console.log('Found user: ' + user);
    var data = self.map.get(user);
    data.currentItem = item;
    self.map.set(user, data);
    console.log('setCurrentItem:' + user +':' + item);
  }
}

UserMap.prototype.getCurrentItem = function(user) {
  var self = this;
  if (self.map.has(user)) {
    var data = self.map.get(user);
    console.log('GetCurrentItem: ' + user + 'currentItem: ' + data.currentItem);
    return data.currentItem;
  } else {
    console.log('user not found:' + user);
  }
}

UserMap.prototype.addCurrentItemToDB = function(user) {
  var self = this;
  var item = self.getCurrentItem(user);
  var queryString = 'INSERT INTO Inventory VALUES (' + '\'' + user +'\',\'' +
    item + '\')';
  console.log('QueryString: ' + queryString);
  this.pool.query(queryString, function (error, results, fields) {
    if (error) {
      console.log(error);
    } else {
      console.log(item + ' inserted');
    }
  });
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.addItemToDB = function(user, item) {
  var self = this;
  var queryString = 'INSERT INTO Inventory VALUES (' + '\'' + user +'\',\'' +
    item + '\')';
  console.log('QueryString: ' + queryString);
  this.pool.query(queryString, function (error, results, fields) {
    if (error) {
      console.log(error);
    } else {
      console.log(item + ' inserted');
    }
  });
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.removeItemFromDB = function(user, item, done) {
  var self = this;
  var queryString = 'DELETE FROM Inventory WHERE userid=' +'\'' + user +
    '\' AND ingredient=' + '\'' + item + '\'';
  console.log('QueryString: ' + queryString);
  this.pool.query(queryString).then(function(error) {
    if (error) {
      console.log(error);
    } else {
      console.log(item + ' deleted');
    }
    done();
  });
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.getInventory = function(user, done) {
  var self = this;
  var queryString = 'SELECT ingredient FROM Inventory WHERE userid=' +'\'' + user +'\'';
  console.log('QueryString: ' + queryString);
  this.pool.query(queryString).then(function(rows) {
    console.log('result:length:' + rows.length);
    var list = 'Inventory:'
    for (var i in rows) {
      list = list.concat('\n' + rows[i].ingredient);
    }
    console.log('List is: ' + list);
    done(list);
  });
}

UserMap.prototype.getMealsForUser = function(user, done) {
  var self = this;
  // Clear out any previous meals search:
  self.recipeMap.delete(user);
  var bigOvenApiKey = OVEN_KEY;
  // Order the ingredients randomly so we can call 'meals' multiple times and get
  // different results.  We can only pass 3 ingredients.
  var queryString = 'SELECT ingredient FROM Inventory WHERE userid=' +'\'' + user +'\' ORDER BY RAND() LIMIT 3';
  console.log('QueryString: ' + queryString);
  this.pool.query(queryString).then(function(rows) {
    if (rows.length == 0) {
      done('You have no inventory.  Try adding some items to your inventory');
    } else {
      var params = '&include_primarycat=maindish,sidedish,appetizers&include_ing=';
      var i = 0;
      while (i < 3 && i < rows.length) {
        params = params.concat(rows[i].ingredient);
        console.log(rows[i].ingredient);
        i++;
        if (i < 3 && i < rows.length) {
          params = params.concat(',');
        }
      }
      params = params.concat('&api_key=' +bigOvenApiKey);

      console.log('Params are: ' + params);

      var options = {
        host: 'api2.bigoven.com',
        path: '/recipes?pg=1&rpp=20' + params,
        port: 443,
        method: 'GET'
      };

      console.log('Path: ' + options.path);

      https.get(options, function(res) {
        var data = '';
        console.log('STATUS: ' + res.statusCode);
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
              console.log(obj.Results[i].Title);
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
      console.log('RecipeIndex: ' + recipeIndex);
      console.log('RecipeID: ' + recipeId);
      var options = {
        host: 'api2.bigoven.com',
        path: '/recipe/' + recipeId + '?api_key=' + OVEN_KEY,
        port: 443,
        method: 'GET'
      };

      console.log('Path: ' + options.path);

      https.get(options, function(res) {
        var data = '';
        console.log('STATUS: ' + res.statusCode);
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          data += chunk;
        });

        res.on('end', function() {
          var obj = JSON.parse(data);
          var recipeReturned = obj.Title + '\nIngredients:\n';
          for (var i = 0; i < obj.Ingredients.length; i++) {
            console.log('Ingredient:' + obj.Ingredients[i].Name);
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
