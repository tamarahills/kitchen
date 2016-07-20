# kitchen

## Toolchain
 run |npm install| in the ./controller directory to install dependencies.

## Running
 run |node server.js| in the ./controller directory to start the server.

 To trigger an item, the command is the following CURL sample:
 |curl -H "Content-Type: application/json" -d '{"deviceid":"1", "item":"pears"}' http://127.0.0.1:8080/item|
 deviceid is the device id that has been assigned to your device.

 You can manually provision the device id and kik username in the UserMap with the SQL statement |insert into Profile (deviceid, userid) values(1, 'kik_userid')|.  Database access and provisioning is coming soon.

 To run the server locally, use ngrok.  Replace the ngrok URL with yours on the baseUrl.  Make sure to leave the /incoming portion.  Replace the bot name with your bot name and API key.

 ## Setting up the KikBot
 Download the Kik Messenger from the iTunes AppStore or Google Play.  Next, search for the user 'smartkitchen' and then it will give you an option to start chatting with the bot.  You can use the following set of commands with the Bot:

 * add <item> - adds item to the inventory
 * rm <item> - removes item from the inventory
 * get - returns a list of the users inventory to them in the bot
 * meals - returns a list of meals the user can cook with their inventory
 * y - confirms an item recognized
 * n - confirms that an item was NOT recognized
 * help - prints out the list of commands.


## Device Software Installation

Clone the repository.

Install dependencies.
```
npm install
```

Hookup the node script to the crontab to start it when rebooting.
Open crontab:
```
sudo crontab -e
```

Add a reboot command:
```
@reboot sudo <path to repo>/device/run_node_script &
```

## Hardware

<img src="https://raw.githubusercontent.com/KevinGrandon/kitchen/master/hardware/fritzing_kitchen.png" width="300">
