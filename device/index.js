var NodeWebcam = require('node-webcam')

var MAX_WIDTH = 2592
var MAX_HEIGHT = 1944

var opts = {
   width: MAX_WIDTH / 2,
   height: MAX_HEIGHT / 2,
   delay: 0,
   quality: 100,
   output: 'jpeg',
   verbose: true
}

var webcam = NodeWebcam.create(opts);
webcam.capture(__dirname + '/test_picture');
