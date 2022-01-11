// bot commands
//
const {
  getChainAndNodesHeight,
  syncGetPreps,
  customPath
} = require("../services");
const fs = require("fs");

const PREPS_PATH = "data/preps.json";

/**
 * bot command '/checkMonitoredNodesHeight'
 * @param {Array.<{name: String, ip: String}>} monitorArray - Array of nodes to monitor.
 */
async function checkMonitoredNodesHeight(monitoredArray) {
  return await checkMonitoredAndBlockProducersHeight(monitoredArray, []);
}

/**
 * bot command '/checkBlockProducersHeight'
 * @param {Array.<{name: String, ip: String}>} nodesArray
 */
async function checkBlockProducersHeight(nodesArray) {
  return await checkMonitoredAndBlockProducersHeight(nodesArray, []);
}

/**
 * bot command '/checkMonitoredAndBlockProducersHeight'
 * @param {Array.<{name: String, ip: String}>} nodesArray
 * @param {Array.<{name: String, ip: String}>} monitorArray - Array of nodes to monitor.
 */
async function checkMonitoredAndBlockProducersHeight(
  nodesArray,
  monitoredArray
) {
  const data = await getChainAndNodesHeight(nodesArray, monitoredArray);
  let nodesWithGap = [];
  for (let node of data.monitored.concat(data.nodes)) {
    nodesWithGap.push({
      gap: data.highestBlock - node.height,
      ...node
    });
  }
  return {
    highestBlock: data.highestBlock,
    nodes: nodesWithGap
  };
}

function updatePrepsList() {
  syncGetPreps(customPath(PREPS_PATH));
}

function showListOfPreps() {
  let preps = null;
  try {
    preps = JSON.parse(fs.readFileSync(customPath(PREPS_PATH)));
  } catch (err) {
    console.log("error while reading data/preps.json");
    console.log(err);
    console.log("creating new list of Preps");
    updatePrepsList();
    preps = JSON.parse(fs.readFileSync(customPath(PREPS_PATH)));
  }
  return preps;
}

module.exports.checkMonitoredAndBlockProducersHeight = checkMonitoredAndBlockProducersHeight;
module.exports.checkMonitoredNodesHeight = checkMonitoredNodesHeight;
module.exports.checkBlockProducersHeight = checkBlockProducersHeight;
module.exports.updatePrepsList = updatePrepsList;
module.exports.showListOfPreps = showListOfPreps;
