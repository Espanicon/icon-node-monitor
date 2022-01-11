// ./test/bot/botCommands.test.js
//

const { botCommands, botReplyMaker } = require("../../bot");
const fs = require("fs");

const MONITOR_RAW = fs.readFileSync("./mock-data/monitor.json");
const PREPS = fs.readFileSync("./mock-data/preps.json");

const MONITOR_ARRAY = JSON.parse(MONITOR_RAW).NODES_ARRAY;
const PREPS_ARRAY = JSON.parse(PREPS).NODES_ARRAY;

async function test() {

  let data = await botCommands.checkMonitoredNodesHeight(MONITOR_ARRAY);
  let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
  console.log(reply);

}
console.log("running botReplyMaker() test");
test();
