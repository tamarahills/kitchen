var NodeWebcam = require('node-webcam')

var opts = {
   width: 1280,
   height: 720,
   delay: 0,
   quality: 100,
   output: 'jpeg',
   verbose: true
}

var webcam = NodeWebcam.create(opts);
webcam.capture('test_picture');
