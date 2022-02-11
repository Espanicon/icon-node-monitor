// tasks.test.js
require("dotenv").config();
const { tasks, customPath } = require("../../services");
const { botCommands } = require("../../bot");
const fs = require("fs");

const NODES = JSON.parse(fs.readFileSync(customPath("/data/preps.json")));

function botSendMsgFunction(botId, reply) {
  console.log("Message from bot");
  console.log(reply);
  return;
}

tasks.checkMonitoredNodesTask(
  botSendMsgFunction,
  10,
  botCommands.checkMonitoredAndBlockProducersHeight
);
