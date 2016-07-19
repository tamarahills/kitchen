/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

var sl = require('simple-node-logger');

function Logger() {
  var opts = {
      logFilePath:'log.log',
      timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
  };
  this.logger = sl.createSimpleLogger(opts);
}

Logger.prototype.getLogger = function() {
  return this.logger;
};

module.exports = Logger;
