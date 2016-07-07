# kitchen

## Toolchain
 run |npm install| in the ./controller directory to install dependencies.

## Running
 run |node server.js| in the ./controller directory to start the server.

 To trigger an item, the command is the following CURL sample:
 |curl -H "Content-Type: application/json" -d '{"userid":"tamarajhills", "item":"pears"}' http://127.0.0.1:8080/item|
 userid is your kik userid

 You can manually provision your kik userid in the UserMap.  Database access and provisioning is coming soon.

 To run the server locally, use ngrok.  Replace the ngrok URL with yours on the baseUrl.  Make sure to leave the /incoming portion.  Replace the bot name with your bot name and API key.
