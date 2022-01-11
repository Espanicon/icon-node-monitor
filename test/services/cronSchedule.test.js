// cronSchedule.test.js
require("dotenv").config();
const { cronSchedule, customPath } = require("../../services");
const { botCommands } = require("../../bot");
const fs = require("fs");

const NODES = JSON.parse(fs.readFileSync(customPath("/data/preps.json")));
const PREPS = NODES.NODES_ARRAY;
const MONITORED = [{ name: process.env.NODE_NAME, ip: process.env.NODE_IP }];

function botSendMsgFunction(botId, reply) {
  console.log("Message from bot");
  console.log(reply);
  return;
}

// const every10MinutesTask = cronSchedule.runEvery10Minutes(
//   PREPS,
//   MONITORED,
//   botSendMsgFunction,
//   10,
//   botCommands.checkMonitoredAndBlockProducersHeight
// );

// every10MinutesTask.start();

cronSchedule.checkMonitoredNodesTask(
  botSendMsgFunction,
  10,
  botCommands.checkMonitoredAndBlockProducersHeight
);
