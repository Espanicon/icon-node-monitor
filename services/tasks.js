// services/task.js
//
const fs = require("fs");
const customPath = require("./customPath.js");
const { model } = require("../model");
const botCommands = require("../bot/botCommands.js");
const lib = require("./lib.js");
const { getNodeGoloopVersion, getGoloopImageTags } = require("../api");

// Global constants
const STRINGS = model.getStrings();
const PREPS = model.getListOfPreps();
const MAX_ALLOWED_BLOCK_GAP = 100;

// TODO: the entire logic of accessing the state should be moved to models.js
const STATE_PATH = "data/state.json";

// Functions
function getBlankState() {
  return {
    highestBlock: 0,
    nodes: [],
    isInAlert: false
  };
}
const INTERVALS = {
  oneSecond: 1000,
  oneMinute: 60000,
  tenMinutes: 600000,
  oneHour: 3600000
};

function setAlarmState(data) {
  let result = data;
  result.isInAlert = false;

  for (let each of data.nodes) {
    if (each.gap > MAX_ALLOWED_BLOCK_GAP) {
      result.isInAlert = true;
      break;
    } else {
      // do nothing
    }
  }
  return result;
}

function create10MinutesTaskReply(firstState, secondState) {
  //
  console.log("First State: " + firstState.isInAlert);
  console.log("Second State: " + secondState.isInAlert);
  let reply = "";
  if (secondState.isInAlert === true) {
    // if alert goes off
    reply += STRINGS.NODES_BLOCK_HEIGHT_REPLIES.msg4 + "\n\n";
    reply += `One or more of your nodes being monitored is offline or lagging in blocks by more than ${MAX_ALLOWED_BLOCK_GAP} blocks.\n\n`;
  } else if (secondState.isInAlert === false && firstState.isInAlert === true) {
    // if alert goes from on to off
    reply += STRINGS.NODES_BLOCK_HEIGHT_REPLIES.msg3 + "\n\n";
    reply += `Your monitored nodes have recovered.\n\n`;
    fs.unlinkSync(customPath(STATE_PATH));
  } else {
    return false;
  }
  secondState.nodes.forEach(node => {
    reply += `Node name: ${node.name}\nNode height: ${node.height}\nNode Gap: ${node.gap}\n\n`;
  });

  return reply;
}

async function checkMonitoredNodesTask() {
  let nodesFileExists = model.prepsFileExists();
  let monitoredNodesExists = model.monitoredNodesExists();
  let makeCheck = botCommands.checkMonitoredAndBlockProducersHeight;

  if (nodesFileExists && monitoredNodesExists) {
    const nodes = PREPS;
    const monitored = model.readDb().monitored;
    try {
      let firstState = null;
      let secondState = getBlankState();
      if (fs.existsSync(customPath(STATE_PATH))) {
        firstState = JSON.parse(
          fs.readFileSync(customPath(STATE_PATH), "utf8")
        );
      } else {
        // do nothin
        firstState = getBlankState();
      }
      const data = await makeCheck(nodes.NODES_ARRAY, monitored);
      for (let eachNode of data.nodes) {
        for (let eachMonitor of monitored) {
          if (eachMonitor.name === eachNode.name) {
            secondState.nodes.push(eachNode);
            secondState.highestBlock = data.highestBlock;
          }
        }
      }
      // assign states and save last state on file
      secondState = setAlarmState(secondState);
      fs.writeFileSync(
        customPath("data/state.json"),
        JSON.stringify(secondState)
      );
      let reply = create10MinutesTaskReply(firstState, secondState);
      if (reply === false) {
        if (fs.existsSync(customPath(STATE_PATH))) {
          fs.unlinkSync(customPath(STATE_PATH));
        }
        console.log("nodes ok\n\n");
      } else {
        fs.writeFileSync(STATE_PATH, JSON.stringify(secondState));
        // botContext(botId, reply);
        console.log("reply from task run: ", reply);
        return reply;
      }
    } catch (err) {
      console.log("error running task");
      console.log(err);
    }
  } else {
    // no node has been added to list of monitored nodes
    console.log(
      "No nodes have been added to monitored list, bypassing recursive task"
    );
  }
  return null;
}

function nodeVersionIsLatest(node, latestVersion) {
  //
}
function getLatestVersion(dockerTags) {
  //
}

async function compareGoloopVersionsTask() {
  // this task will run once every hour to check if the node goloop version
  // is up to date
  let db = model.readDb();
  let result = {
    version: null,
    nodes: []
  };

  if (db.monitored.length > 0 && db.report.length > 0) {
    // if there are nodes to monitor and people to report

    let dockerImageVersions = await getGoloopImageTags();
    let latestVersion = lib.getLatestVersion(dockerImageVersions);
    result.version = latestVersion;

    for (let eachNode of db.monitored) {
      let nodeDataWithVersion = await getNodeGoloopVersion(eachNode);
      result.nodes.push(nodeDataWithVersion);
    }
  } else {
    console.log(
      "Skipping version check. either no nodes or people to report has been added"
    );
    if (db.monitored > 0) {
      // if there are nodes but no people to report
    } else {
      // if there are people to report but no nodes
    }
    return null;
  }
  return result;
}

module.exports = {
  checkMonitoredNodesTask: checkMonitoredNodesTask,
  INTERVALS: INTERVALS,
  compareGoloopVersionsTask: compareGoloopVersionsTask
};
