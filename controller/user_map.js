var mysql = require('promise-mysql');

function UserMap() {
  var self = this;
  this.map = new Map();
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


module.exports = UserMap;
