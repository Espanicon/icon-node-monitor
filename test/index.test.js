// /test/index.test.js
//
require("dotenv").config();
const { botCommands, botReplyMaker, customScenes } = require("../bot");
const { customPath, tasks } = require("../services");
const { model } = require("../model");
const fs = require("fs");

const PREPS = model.getListOfPreps().NODES_ARRAY;
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONITORED = model.readDb().monitored;
const _DB_ = "data/db.json";
const MOCK = {
  users: [{ username: "Espanicon_Prep", id: 1179874 }],
  monitored: [{ name: "Espanicon", ip: "65.108.47.72" }],
  admin: { username: "Espanicon_Prep", id: 1179874 },
  state: { locked: true }
};

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
  addMeToReport() {
    let reply = botCommands.addMeToReport(MOCK.users[0]);
    return reply;
  }
  addGroupToReport() {
    let reply = "Command /addGroupToReport not yet implemented";
    return reply;
  }
  showListOfMonitored() {
    let reply = "Command /showListOfMonitored not yet implemented";
  }
  addNode() {
    let db = customScenes.readDbAndCheckForAdmin(MOCK.users[0]);
    let reply = model.updateDbMonitored(MOCK.monitored[0], "ADD");
    return reply;
  }
  checkNode() {
    let db = customScenes.readDbAndCheckForAdmin(MOCK.monitored[0]);
    return db.monitored;
  }
  editNode() {
    let db = customScenes.readDbAndCheckForAdmin(MOCK.monitored[0]);
    let reply = model.updateDbMonitored(MOCK.monitored[0], "DELETE");
    return reply;
  }
  addTask() {
    let db = customScenes.readDbAndCheckForAdmin(MOCK.users[0]);
    this.addMeToReport(MOCK.users[0]);
    let reply = model.readDb();
    return reply;
  }
  checkTask() {
    let db = customScenes.readDbAndCheckForAdmin(MOCK.users[0]);
    let reply = db.report;
    return reply;
  }
  editTask() {
    let db = customScenes.readDbAndCheckForAdmin(MOCK.users[0]);
    let reply = model.removeUsersFromDbReport("Espanicon_Prep");
    return reply;
  }
}

function botSendMsgFunction(taskResult) {
  let db = model.readDb();
  if (taskResult == null) {
  } else {
    if (db.report.length > 0) {
      for (let eachUserToReport of db.report) {
        console.log(
          `Sending message to user @${eachUserToReport.username}\n`,
          taskResult
        );
      }
    }
  }
}

async function runEveryMinute() {
  if (fs.existsSync(customPath(_DB_))) {
    let db = JSON.parse(fs.readFileSync(customPath(_DB_)));
    if (db.report.length > 0) {
      console.log(
        "Running recursive task every minute. Users to report in case of node issues are: ",
        db.report
      );
      let taskResult = await tasks.checkMonitoredNodesTask();
      botSendMsgFunction(taskResult);
    } else {
      console.log("No users added to report list, skipping recursive check");
    }
  }

  setTimeout(runEveryMinute, tasks.INTERVALS.oneMinute);
}

(async () => {
  let newBot = new Bot(PREPS, MONITORED);
  let breakLine = "\n-----------\n";

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

  // // test command 'add node'
  // console.log('\nRunning test "add node"\n');
  // let result4 = newBot.addNode();
  // console.log(result4, breakLine);

  // // test command 'check node'
  // console.log('\nRunning test "check node"\n');
  // let result5 = newBot.checkNode();
  // console.log(result5, breakLine);

  // // test command 'edit node'
  // console.log('\nRunning test "edit node"\n');
  // let result6 = newBot.editNode();
  // console.log(result6, breakLine);

  // // test command 'add task'
  // console.log('\nRunning test "add task"\n');
  // let result7 = newBot.addTask();
  // console.log(result7, breakLine);

  // // test command 'check task'
  // console.log('\nRunning test "check task"\n');
  // let result8 = newBot.checkTask();
  // console.log(result8, breakLine);

  // // test command 'edit task'
  // console.log('\nRunning test "edit task"\n');
  // let result9 = newBot.editTask();
  // console.log(result9, breakLine);

  setTimeout(runEveryMinute, tasks.INTERVALS.oneMinute);
})();
