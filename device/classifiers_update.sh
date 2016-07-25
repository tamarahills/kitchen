#!/bin/sh
# This script is called from /crontab and runs at midnight every night.
# It updates the classifers.json so we can add more classifiers to the project
# without updation of the physical device or asking user to do something.
wget https://raw.githubusercontent.com/tamarahills/kitchen/master/device/classifiers.json
