#!/bin/sh
# This script is called from /etc/rc.local and runs the node server on startup.
# We have to sleep for a while on startup to avoid strange issues with GPIO pins.
sleep 10
sudo node index.js
