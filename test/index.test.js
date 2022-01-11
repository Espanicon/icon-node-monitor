// script.js
//
require("dotenv").config();
const { botCommands, botReplyMaker } = require("../bot");
const { customPath } = require("../services");
const fs = require("fs");
console.log("fo");
console.log(customPath);

const NODES = JSON.parse(fs.readFileSync(customPath("/data/preps.json")));
const PREPS = NODES.NODES_ARRAY;
const MONITORED = [{ name: process.env.NODE_NAME, ip: process.env.NODE_IP }];

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

(async () => {
  let newBot = new Bot(PREPS, MONITORED);

  // test command /checkMonitoredAndBlockProducersHeight
  let command1 = await newBot.checkMonitoredAndBlockProducersHeight();
  console.log("testing command /checkMonitoredAndBlockProducersHeight");
  console.log(command1);

  // test command /checkBlockProducersHeight
  let command2 = await newBot.checkBlockProducersHeight();
  console.log("testing command /checkBlockProducersHeight");
  console.log(command2);

  // test command /checkMonitoredNodesHeight
  let command3 = await newBot.checkMonitoredNodesHeight();
  console.log("testing command /checkMonitoredNodesHeight");
  console.log(command3);
})();
