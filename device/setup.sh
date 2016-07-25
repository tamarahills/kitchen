#!/bin/sh

echo "******************"
echo "installing node..."
echo "******************"
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "***************************"
echo "installing camera driver..."
echo "***************************"
sudo apt-get install -y fswebcam

mkdir -p /home/pi/workspace
cd /home/pi/workspace
echo "***********************"
echo "cloning kitchen repo..."
echo "***********************"
git clone https://github.com/tamarahills/kitchen.git

cd kitchen/device
echo "***************************"
echo "installing node packages..."
echo "***************************"
npm install

echo "***************************"
echo "done"
echo "***************************"

