#!/bin/sh
# This script is called as a cron job; it runs at midnight every night.
# It updates the ´device' directory so we can add more classifiers to the project
# and update the device script without needing the user to take any action.
cd /home/pi/workspace/kitchen/device
git pull origin master
echo "rebooting in 5 seconds..."
sleep 5
sudo /sbin/reboot
