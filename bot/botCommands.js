// bot commands
//
// const { getChainAndNodesHeight, customPath } = require("../services");
const getChainAndNodesHeight = require("../services/getChainAndNodesHeight.js");
const customPath = require("../services/customPath.js");
const lib = require("../services/lib.js");
const { model } = require("../model");
const { getGoloopImageTags, getNodeGoloopVersion } = require("../api");

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
/**
 * bot command '/unlock'
 */
function unlock(currentUser) {
  let reply = "";
  let db = model.readDbAndCheckForAdmin(currentUser);
  if (currentUser.id != db.admin.id && db.state.locked === true) {
    reply += "The bot is currently locked and only the bot admin can unlock it";
  } else {
    model.unlock();
    reply +=
      "Bot unlocked, every user can now add/remove nodes and users from the report list";
  }
  return reply;
}
/**
 * bot command '/lock'
 */
function lock(currentUser) {
  let reply = "";
  let db = model.readDbAndCheckForAdmin(currentUser);
  if (currentUser.id != db.admin.id && db.state.locked === true) {
    reply += "The bot is already locked";
  } else {
    model.lock();
    reply +=
      "Bot locked, only the bot admin can now add/remove nodes and users from the report list";
  }
  return reply;
}
function showListOfMonitored(db) {
  let reply = "You are currently monitoring the following nodes:\n\n";
  for (let eachNode of db.monitored) {
    reply += `Node name: ${eachNode.name}.\nNode IP: ${eachNode.ip}`;
  }

  return reply;
}
function testReport(db) {
  let reply = "Test message from Icon-node-monitor";
  return reply;
}
function addMeToReport(ctxFrom) {
  return model.updateDbReport(ctxFrom);
}
function addGroupToReport(ctxChat, ctxFrom) {
  let groupData = { id: ctxChat.id, username: ctxChat.title };
  let reply = "";
  let db = model.readDbAndCheckForAdmin(ctxFrom);
  if (ctxFrom.id != db.admin.id && db.state.locked === true) {
    reply += `The bot is locked, only the bot admin (@${db.admin.username}) can add this group to the report list.`;
  } else {
    reply += model.updateDbReport(groupData);
  }
  return reply;
}

function updatePrepsList() {
  model.updatePrepsList();
}

function showListOfPreps() {
  return model.getListOfPreps();
}
function checkVersion(foo, bar) {
  //
}

module.exports = {
  checkMonitoredAndBlockProducersHeight: checkMonitoredAndBlockProducersHeight,
  checkMonitoredNodesHeight: checkMonitoredNodesHeight,
  checkBlockProducersHeight: checkBlockProducersHeight,
  updatePrepsList: updatePrepsList,
  showListOfPreps: showListOfPreps,
  addMeToReport: addMeToReport,
  lock: lock,
  unlock: unlock,
  showListOfMonitored: showListOfMonitored,
  testReport: testReport,
  addGroupToReport: addGroupToReport,
  checkVersion: checkVersion
};
