#!/bin/sh
# This script is called from /crontab and runs the node server on startup.
# We have to sleep for a while on startup to avoid strange issues with GPIO pins.
PATH=`dirname $(which node)`
sleep 15
sudo node /home/pi/workspace/kitchen/device/index.js > /home/pi/workspace/kitchen/device/tmp.log
