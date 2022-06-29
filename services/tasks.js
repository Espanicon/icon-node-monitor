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
  oneHour: 3600000,
  oneDay: 86400000
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

async function compareGoloopVersionsTask(alarm = false) {
  // this task will run once every hour to check if the node goloop version
  // is up to date
  let db = model.readDb();
  let alarmState = alarm;
  let reply = "Goloop version check on all monitored nodes.\n\n";
  let result = {
    version: null,
    nodes: []
  };
  console.log(db);

  if (
    db.monitored.length > 0 &&
    db.report.length > 0 &&
    db.versionCheck === true
  ) {
    // if there are nodes to monitor and people to report and versionCheck is on

    let dockerImageVersions = await getGoloopImageTags();
    let latestVersion = lib.getLatestVersion(dockerImageVersions);
    result.version = latestVersion;
    reply += `Goloop docker image version: ${result.version}\n\n`;

    for (let eachNode of db.monitored) {
      let nodeDataWithVersion = await getNodeGoloopVersion(eachNode);
      result.nodes.push(nodeDataWithVersion);
      reply += `Node name: ${nodeDataWithVersion.name}\nNode IP: ${nodeDataWithVersion.ip}\nNode goloop version: ${nodeDataWithVersion.version}\n\n`;
    }

    for (let eachNode of result.nodes) {
      // TODO: this is the logic to set the alarm on, if the docker version of
      // goloop (result.version) is not the same as the goloop version of all
      // the nodes (eachNode.version) then we set 'alarmState = true'.
      // this might fail if the version tag is 'latest' or if the version
      // is a patch (i.e 'v1.2.3-e3a15f0')
      if (result.version != eachNode.version) {
        alarmState = true;
      }
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
  // uncomment the below line for testing the function
  // alarmState = true;
  //
  if (alarmState === false) {
    return null;
  } else {
    return reply;
  }

  // this next line of code should never happen
  throw "ERROR: error in the code logic of compareGoloopVersionsTask()";
}

async function checkNetworkProposals() {
  // get block height,
  // get proposals
  // get last proposal id in db
  //
  const lastBlockInNetwork = await model.getLastBlock();
  const proposals = await model.getProposals();

  if (lastBlockInNetwork === null || proposals === null) {
    console.log("error running checkNetworkProposals task");
    return null;
  }
  let db = model.readDb();
  const lastProposalIdInDb = db.lastProposalId;

  // get how many new proposals there are (returns array)
  const newProposalsInNetwork = await model.getNewProposalsSummary(
    lastProposalIdInDb
  );
  console.log("new proposals");
  console.log(newProposalsInNetwork);
  if (newProposalsInNetwork === null) {
    // if newProposalsInNetwork === null there are no new proposals, so
    // we return null
    return null;
  }

  //// if there are any new proposals check end block of last proposal
  //// if end block is higher than current block, set last proposal id
  //// in db equal to last proposal on network
  const lastProposalInNetworkBlockHeight = newProposalsInNetwork.slice(-1)
    .end_block_height;
  if (lastProposalInNetworkBlockHeight > lastBlockInNetwork) {
    db.lastProposalId = newProposalsInNetwork.slice(-1).id;
    model.writeDb(db);
    return `Proposal "${newProposalsInNetwork.slice(-1).title}" has ended.`;
  }
  //// if end block is not higher than current block print proposal info
  const reply = await model.parseNewProposalsSummary(newProposalsInNetwork);
  return reply;
}

async function recursiveTask(task, sendMsgHandler, interval) {
  let db = model.readDb();
  if (db.report.length > 0) {
    console.log(
      `Running recursive task every ${interval} ms. Users to report for this task are: `,
      db.report
    );
    let taskResult = await task();
    sendMsgHandler(taskResult);
  } else {
    console.log("No users added to the report list, skipping recursive task");
  }
}

module.exports = {
  checkMonitoredNodesTask: checkMonitoredNodesTask,
  INTERVALS: INTERVALS,
  compareGoloopVersionsTask: compareGoloopVersionsTask,
  recursiveTask: recursiveTask,
  checkNetworkProposals: checkNetworkProposals
};
