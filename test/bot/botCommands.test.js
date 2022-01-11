// ./test/bot/botCommands.test.js
//

const { botCommands } = require("../../bot");
const fs = require("fs");

const MONITOR_RAW = fs.readFileSync("./mock-data/monitor.json");
const PREPS = fs.readFileSync("./mock-data/preps.json");

const MONITOR_ARRAY = JSON.parse(MONITOR_RAW).NODES_ARRAY;
const PREPS_ARRAY = JSON.parse(PREPS).NODES_ARRAY;

async function test() {
  let result = await botCommands.checkMonitoredAndBlockProducersHeight(
    PREPS_ARRAY,
    MONITOR_ARRAY
  );

  let result2 = await botCommands.checkMonitoredNodesHeight(MONITOR_ARRAY);
  let result3 = await botCommands.checkBlockProducersHeight(PREPS_ARRAY);

  console.log("command /checkMonitoredAndBlockProducersHeight");
  console.log(result);

  console.log("command /checkMonitoredNodesHeight");
  console.log(result2);

  console.log("command /checkBlockProducersHeight");
  console.log(result3);
}
console.log("running botCommands() test");
test();
