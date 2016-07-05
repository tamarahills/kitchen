/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// BASE SETUP
// ==============================================
'use strict';
var express = require('express');
var app     = express();
var port    =   process.env.PORT || 8080;
let util = require('util');
let http = require('http');
let Bot = require('@kikinteractive/kik');

// ROUTES
// ==============================================

// sample route with a route the way we're used to seeing it
app.get('/sample', function(req, res) {
    res.send('this is a sample!');
});

// we'll create our routes here
// get an instance of router
var router = express.Router();

// home page route (http://localhost:8080)
router.get('/', function(req, res) {
    res.send('im the home page!');
});

// about page route (http://localhost:8080/about)
router.get('/about', function(req, res) {
    res.send('im the about page!');
});

router.get('/addItem/:name', function(req, res) {
  res.send('hello ' + req.params.name + '!');
});

// route middleware to validate :name
router.param('name', function(req, res, next, name) {
    // do validation on name here
    // blah blah validation
    // log something so we know its working
    console.log('doing name validations on ' + name);

    // once validation is done save the new item in the req
    req.name = name;
    // go to the next thing
    next();
});

// apply the routes to our application
app.use('/', router);

app.listen(port);
console.log('Magic happens on port ' + port);
