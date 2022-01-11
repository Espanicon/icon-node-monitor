// ./test/getChainAndNodesHeight.test.js
//

const { getChainAndNodesHeight } = require("../../services");
const fs = require("fs");

const MONITOR_RAW = fs.readFileSync("./mock-data/monitor.json");
const PREPS = fs.readFileSync("./mock-data/preps.json");

const MONITOR_ARRAY = JSON.parse(MONITOR_RAW).NODES_ARRAY;
const PREPS_ARRAY = JSON.parse(PREPS).NODES_ARRAY;

async function test() {
  let result = await getChainAndNodesHeight(PREPS_ARRAY, MONITOR_ARRAY);
  console.log('test with monitored nodes');
  console.log(result);

  let result2 = await getChainAndNodesHeight(PREPS_ARRAY);
  console.log('test without monitored nodes');
  console.log(result2);
}
console.log("running getChainAndNodesHeight() test");
test();
