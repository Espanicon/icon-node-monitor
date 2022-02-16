// bot commands
//
const { getChainAndNodesHeight, customPath } = require("../services");
const fs = require("fs");
const { model } = require("../model");

/**
 * bot command '/checkMonitoredNodesHeight'
 */
async function checkMonitoredNodesHeight() {
  const monitored = model.readDb().monitored;
  if (monitored.length > 0) {
    // if there are no nodes added to the list of monitored we return a null value
    const check = chainAndNodesCheck(monitored);
    return check;
  } else {
    return null;
  }
}

/**
 * bot command '/checkBlockProducersHeight'
 */
async function checkBlockProducersHeight() {
  const preps = model.getListOfPreps().NODES_ARRAY;
  const check = chainAndNodesCheck(preps);
  return check;
}

/**
 * bot command '/checkMonitoredAndBlockProducersHeight'
 */
async function checkMonitoredAndBlockProducersHeight() {
  const preps = model.getListOfPreps().NODES_ARRAY;
  const monitored = model.readDb().monitored;
  if (monitored.length > 0) {
    // if there are no nodes added to the list of monitored we return a null value
    const check = chainAndNodesCheck(preps, monitored);
    return check;
  } else {
    return null;
  }
}
async function chainAndNodesCheck(firstArrayOfNodes, secondArrayOfNodes = []) {
  const data = await getChainAndNodesHeight(
    firstArrayOfNodes,
    secondArrayOfNodes
  );
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

function addMeToReport(ctxFrom) {
  return model.updateDbReport(ctxFrom);
}

function updatePrepsList() {
  model.updatePrepsList();
}

function showListOfPreps() {
  return model.getListOfPreps();
}

module.exports = {
  checkMonitoredAndBlockProducersHeight: checkMonitoredAndBlockProducersHeight,
  checkMonitoredNodesHeight: checkMonitoredNodesHeight,
  checkBlockProducersHeight: checkBlockProducersHeight,
  updatePrepsList: updatePrepsList,
  showListOfPreps: showListOfPreps,
  addMeToReport: addMeToReport
};
