// script.js
//
require("dotenv").config();
const { botCommands, botReplyMaker } = require("../bot");
const { customPath, tasks } = require("../services");
const fs = require("fs");

const NODES = JSON.parse(fs.readFileSync(customPath("/data/preps.json")));
const PREPS = NODES.NODES_ARRAY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

let MONITORED = [];
if (fs.existsSync(customPath("data/monitor.json"))) {
  MONITORED = JSON.parse(fs.readFileSync(customPath("data/monitor.json")))
    .monitored;
}

class Bot {
  constructor(preps, monitored) {
    this.preps = preps;
    this.monitored = monitored;
  }
  async checkMonitoredAndBlockProducersHeight() {
    let data = await botCommands.checkMonitoredAndBlockProducersHeight(
      this.preps,
      this.monitored
    );
    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    return reply;
  }
  async checkBlockProducersHeight() {
    let data = await botCommands.checkBlockProducersHeight(this.preps);
    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    return reply;
  }
  async checkMonitoredNodesHeight() {
    let data = await botCommands.checkMonitoredNodesHeight(this.monitored);
    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    return reply;
  }
}

function botSendMsgFunction(groupId, reply) {
  console.log(reply);
}

function runEveryMinute() {
  tasks.checkMonitoredNodesTask(
    botSendMsgFunction,
    GROUP_ID,
    botCommands.checkMonitoredAndBlockProducersHeight
  );

  setTimeout(runEveryMinute, tasks.INTERVALS.oneMinute);
}

(async () => {
  let newBot = new Bot(PREPS, MONITORED);

  // test command /checkMonitoredAndBlockProducersHeight
  // let command1 = await newBot.checkMonitoredAndBlockProducersHeight();
  // console.log("testing command /checkMonitoredAndBlockProducersHeight");
  // console.log(command1);

  // // test command /checkBlockProducersHeight
  // let command2 = await newBot.checkBlockProducersHeight();
  // console.log("testing command /checkBlockProducersHeight");
  // console.log(command2);

  // // test command /checkMonitoredNodesHeight
  // let command3 = await newBot.checkMonitoredNodesHeight();
  // console.log("testing command /checkMonitoredNodesHeight");
  // console.log(command3);

  setTimeout(runEveryMinute, tasks.INTERVALS.oneMinute);
})();
