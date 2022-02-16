// script.js
//
require("dotenv").config();
const { botCommands, botReplyMaker } = require("../bot");
const { customPath, tasks } = require("../services");
const { model } = require("../model");
const fs = require("fs");

const PREPS = model.getListOfPreps().NODES_ARRAY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;
const MONITORED = model.readDb().monitored;
const _DB_ = "data/db.json";

class Bot {
  constructor(preps, monitored) {
    this.preps = preps;
    this.monitored = monitored;
  }
  async checkMonitoredAndBlockProducersHeight() {
    let data = await botCommands.checkMonitoredAndBlockProducersHeight();
    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    return reply;
  }
  async checkBlockProducersHeight() {
    let data = await botCommands.checkBlockProducersHeight();
    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    return reply;
  }
  async checkMonitoredNodesHeight() {
    let data = await botCommands.checkMonitoredNodesHeight();
    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    return reply;
  }
}

function botSendMsgFunction(arrayOfUsersToReport, reply) {
  for (let eachUserToReport of arrayOfUsersToReport) {
    console.log(
      `Sending message to user @${eachUserToReport.username}\n`,
      reply
    );
  }
}

function runEveryMinute() {
  if (fs.existsSync(customPath(_DB_))) {
    let db = JSON.parse(fs.readFileSync(customPath(_DB_)));
    console.log(
      "Running recursive task every minute. Users to report in case of node issues are: ",
      db.report
    );
    if (db.report.length > 0) {
      tasks.checkMonitoredNodesTask(
        botSendMsgFunction,
        db.report,
        botCommands.checkMonitoredAndBlockProducersHeight
      );
    }
  }

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
