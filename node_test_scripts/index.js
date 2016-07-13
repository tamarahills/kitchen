var NodeWebcam = require('node-webcam')
var five = require('johnny-five');
var Raspi = require('raspi-io');

var BUTTON_DOUBLE_CLICK_TIMEOUT = 300

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
