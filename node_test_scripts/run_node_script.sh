#!/bin/sh
# This script is called from /crontab and runs the node server on startup.
# We have to sleep for a while on startup to avoid strange issues with GPIO pins.
sleep 15
sudo node /home/pi/workspace/kitchen/node_test_scripts/index.js > tmp.log
