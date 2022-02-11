# Icon-node-monitor Bot

*Icon-node-monitor* is a bot intended to keep track of the status of a node (or list of nodes) in the ICON Network.

To use the bot please follow the instructions in the **Install** section.

## How to use
To start using the bot, send the command `/start`, the bot will reply with a message asking you to add the nodes you would like to monitor.
![adding a node to monitor](./misc/images/icon-node-monitor-1.png)

After adding a node, you can use any of the bots commands. Currently the bot has the following commands (you can always send `/info` as a command to the bot to get the list of commands):
* `/start` => command used to initialize the bot.
* `/info` => replies with info about the bot.
* `/checkMonitoredNodesHeight` => replies with the block gap between the ICON chain and the nodes to be monitored.
* `/checkMonitoredAndBlockProducersHeight` => replies with the current block in the chain and the highest block for each block producer and your monitored nodes.
* `/checkBlockProducersHeight` => replies with the current block in the chain and the highest block for each block producer.
* `/updatePrepsList` => Updates the list of block producers to check (Preps).
* `/showListOfPreps` => Replies with a list of the block producers in the network (Preps).

Adding a group id or user id in the `.env` file will allow the bot to run a check every minute and send an alarm to the user or group you have specified.

## Install
To run your own version of the bot locally you will need [nodejs](https://nodejs.org/en/download/) version 17.4.0 or newer.

Clone the project in a local folder and then run `npm install`.

You will need a bot authentication token from telegram, to get one you can follow [these instructions](https://core.telegram.org/bots).

Create a `.env` file inside the project folder. The content of this file should look like this:
```
BOT_TOKEN="YOUR_AUTHENTICATION_TOKEN"
GROUP_ID="000000000"
```

In the `BOT_TOKEN` variable paste the authentication token you got from *BotFather* and in the `GROUP_ID` variable you need to paste either the id of a telegram group in which the bot has been added or the id of the telegram user that will receive the alerts. To find either your telegram id or the id of a telegram group you can use [IDBot](https://telegram.me/myidbot).

You can now run your own version of the bot locally with the command `npm run start`


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details



