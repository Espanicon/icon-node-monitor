// bot commands
//
const getChainAndNodesHeight = require("../services/getChainAndNodesHeight.js");
const customPath = require("../services/customPath.js");
const lib = require("../services/lib.js");
const { model } = require("../model");
const { getGoloopImageTags, getNodeGoloopVersion } = require("../api");
const useLog = require("../services/logger.js");

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

function getListOfPreps() {
  let preps = model.getListOfPreps();
  if (preps == null) {
    return null;
  } else {
    return preps.NODES_ARRAY;
  }
}

async function checkBlockProducersHeight() {
  const preps = getListOfPreps();

  if (preps == null) {
    return null;
  } else {
    return chainAndNodesCheck(preps);
  }
}

/**
 * bot command '/checkMonitoredAndBlockProducersHeight'
 */
async function checkMonitoredAndBlockProducersHeight() {
  const preps = getListOfPreps();
  const monitored = model.readDb().monitored;
  if (monitored.length > 0 && preps != null) {
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

async function updatePrepsList() {
  let result = await model.updatePrepsList();
  if (result === true) {
    return "Prep list was successfully updated";
  } else {
    return "Error while trying to update Prep list. In order to create and/or update the Prep list is necessary to add at least one node to monitor.";
  }
}

function showListOfPreps() {
  return getListOfPreps();
}
async function summary(db) {
  //
  let lineBreak = "=======================";
  let reply = `Summary of the nodes and the users in the report list.\n\n${lineBreak}\nReport list:\n\n`;

  if (db.report.length > 0) {
    db.report.forEach(user => {
      reply += `Username: @${user.username}\n`;
    });
  } else {
    reply += `There are no users added to the report list.\n`;
  }
  reply += `\n${lineBreak}\nNodes being monitored:\n\n`;

  if (db.monitored.length > 0) {
    db.monitored.forEach(node => {
      reply += `Node name: ${node.name}\nNode ip: ${node.ip}\n`;
    });
  } else {
    reply += `There are no nodes to monitor added yet\n`;
  }

  return reply;
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
  summary: summary
};
