var NodeWebcam = require('node-webcam')
var five = require('johnny-five');
var Raspi = require('raspi-io');
var http = require('http');
var watson = require('watson-developer-cloud');
var fs = require('fs');
var nconf = require('nconf');

var BUTTON_DOUBLE_CLICK_TIMEOUT = 300

// Use nconf to get the configuration for the device.
nconf.argv()
   .env()
   .file({ file: './config.json' });

var board = new five.Board({
  io: new Raspi(),
  repl: false
});

board.on("ready", function() {
	var button = new five.Button({
		pin: 'P1-11',
		isPullup: true
	});
 	var led = new five.Led('P1-12');
 	led.off();

 	// Toggle LED on and off to signal startup
 	led.on();
 	setTimeout(function() {
 		led.off();
 	}, 1500);

 	var downTimes = 0;
 	var processTimeout = null;

 	button.on('down', function() {
		console.log('button triggered (down)');
		downTimes++;
		if (!processTimeout) {
			processTimeout = setTimeout(() => {
				console.log('processing num times:', downTimes);
				if (downTimes === 1) {
					// Watson
					led.blink();
				} else if (downTimes >= 2) {
					// Barcode
					led.on();
				}

				takePicture(function() {
					console.log('camera done taking picture.');
					led.stop();
					led.off();

          processPicture();

					clearTimeout(processTimeout);
					processTimeout = null;

					downTimes = 0;
				});
			}, BUTTON_DOUBLE_CLICK_TIMEOUT)
		}
	});
});

function takePicture (cb) {
	var MAX_CAMERA_WIDTH = 2592
	var MAX_CAMERA_HEIGHT = 1944

	var opts = {
	   width: MAX_CAMERA_WIDTH / 4,
	   height: MAX_CAMERA_HEIGHT / 4,
	   delay: 0,
	   quality: 100,
	   output: 'jpeg',
	   verbose: true
	}

	var webcam = NodeWebcam.create(opts);
	webcam.capture(__dirname + '/test_picture', cb);
}

function processPicture() {
  var item_array = [];

  var visual_recognition = watson.visual_recognition({
    api_key: nconf.get('api_key'),
    version: 'v3',
    version_date: '2016-05-19'
  });

  var params = {
    images_file: fs.createReadStream('./fruitbowl.jpg'),
    classifier_ids: ['greenpepper_194357852', 'orange_2010321797', 'banana_760231312', 'default']
  };

  visual_recognition.classify(params, function(err, res) {
    if (err)
      console.log(err);
    else {
      console.log(JSON.stringify(res, null, 2));
      // There should only be one imaged processed at a time.
      if (res.images_processed == 1) {
        var classifiers = res.images[0].classifiers;
        for (var i = 0; i < classifiers.length; i++) {
          var classifier = classifiers[i];
          // If it's the default watson classifier, then we can just use the "class" attribute.
          if (classifier.classifier_id.localeCompare('default') == 0) {
            console.log('classes length:' + classifier.classes.length);
            for (var j = 0; j < classifier.classes.length; j++) {
              console.log(classifier.classes[j].class);
              item_array.push(classifier.classes[j].class)
            }
          } else {
            // If the classifier is one of our custom ones, then we can just use the
            // "name" attribute
            item_array.push(classifier.name);
          }
        }
      } else {
        console.log('Error processing the image file:');
      }
    }
    // Post the Results to the server.
    item_array.forEach(function (item, index, array) {
      console.log(item);
    });
    if (item_array.length > 0) {
      postToServer(item_array[0]);
    } else {
      postToServer('NoResults');
    }
  });

  function postToServer(itemString) {
    var post_options = {
      host: nconf.get('host'),
      port: '8080',
      path: '/item',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
    };

    var post_req = http.request(post_options, function(res) {
      console.log('completed the post: ' + res.statusCode);
    });
    // post the data
    var post_data = {
      deviceid: nconf.get('user_key'),
      item: itemString
    };
    post_req.write(JSON.stringify(post_data));
    post_req.end();
  }
}
