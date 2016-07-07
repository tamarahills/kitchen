function UserMap() {
   this.map = new Map();
   //TODO:  need to initialize this from the Database.
   //TODO: Store in the map as a JSON object.  Will need to format each
   // user from DB like this to insert in the map.
   var json = {
     state: 0,
     currentItem: 'none'
   }
   this.map.set('tamarajhills', json);
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
  }
}

UserMap.prototype.getCurrentItem = function(user) {
  var self = this;
  if (self.map.has(user)) {
    var data = self.map.get(user);
    console.log('Found user: ' + user + 'currentItem: ' + data.currentItem);
    return data.currentItem;
  }
}

UserMap.prototype.addCurrentItemToDB = function(user) {
  var self = this;
  //TODO HERE: make the call to the database to add the item.
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.addItemToDB = function(user, item) {
  var self = this;
  //TODO HERE: make the call to the database to add the item.
  //Make sure to use the item passed in here and not the currentItem. Reset the
  //currentItem to be safe.
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.removeItemFromDB = function(user, item) {
  var self = this;
  //TODO HERE: make the call to the database to remove the item.
  //Make sure to use the item passed in here and not the currentItem. Reset the
  //currentItem to be safe.
  self.setCurrentItem(user, 'none');
}

UserMap.prototype.getInventory = function(user) {
  var self = this;
  //TODO HERE:  Call DB and get a list of the user's inventory and return it.
  return '\npotatoes, \nonions, \ncarrots, \nground beef, \nsalt, \npepper, \nchocolate frosting';
}


module.exports = UserMap;
