// services/task.js
//
const fs = require("fs");
const customPath = require("./customPath.js");
const { model } = require("../model");
const botCommands = require("../bot/botCommands.js");
const lib = require("./lib.js");
const { getNodeGoloopVersion, getGoloopImageTags } = require("../api");
const useLog = require("./logger.js");

// Global constants
const STRINGS = model.getStrings();
const PREPS = model.getListOfPreps();
const MAX_ALLOWED_BLOCK_GAP = 100;

// TODO: the entire logic of accessing the state should be moved to models.js
const STATE_PATH = "data/state.json";
const LOG_PATH = "logs/";

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
  useLog("First State: " + firstState.isInAlert);
  useLog("Second State: " + secondState.isInAlert);
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
        useLog("nodes ok\n\n");
      } else {
        fs.writeFileSync(STATE_PATH, JSON.stringify(secondState));
        // botContext(botId, reply);
        useLog("reply from task run: ", reply);
        return reply;
      }
    } catch (err) {
      useLog("error running task");
      useLog(err);
    }
  } else {
    // no node has been added to list of monitored nodes
    useLog(
      "No nodes have been added to monitored list, bypassing recursive task"
    );
  }
  useLog("Task result: running checkMonitoredNodeTask.");
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
  useLog(db);

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
    useLog(
      "Skipping version check. either no nodes or people to report has been added"
    );
    if (db.monitored > 0) {
      // if there are nodes but no people to report
    } else {
      // if there are people to report but no nodes
    }
    useLog("Task result: running compareGoloopVersionTask.");
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
  // task to check network proposals
  //
  // get block height
  useLog("Running task: CheckNetworkProposals");
  let reply = null;
  const lastBlockInNetwork = await model.getLastBlock();
  if (lastBlockInNetwork === null) {
    useLog("error running checkNetworkProposals task");
    return null;
  }

  // read db and get block height of last checked network proposals
  let db = model.readDb();
  let lastProposalInDb =
    db.lastBlockHeightCheckedForProposals == null
      ? lastBlockInNetwork
      : db.lastBlockHeightCheckedForProposals;

  // get how many new proposals there are (returns array)
  // or null if none
  const newProposalsInNetwork = await model.getNewProposalsSummary(
    lastProposalInDb
  );
  useLog("new proposals");
  useLog(newProposalsInNetwork);

  // early return if no new proposals found
  if (newProposalsInNetwork === null) {
    // if newProposalsInNetwork === null there are no new proposals, so
    // we return null
    useLog("Task result: running checkNetworkProposals. no new proposal found");
    db.lastBlockHeightCheckedForProposals = lastProposalInDb;
    model.writeDb(db);
    return null;
  }

  let proposalsToUseInReply = [];
  for (let proposal of newProposalsInNetwork) {
    if (proposal.end_block_height > lastBlockInNetwork) {
      proposalsToUseInReply.push(proposal);
    } else {
      if (lastProposalInDb > proposal.start_block_height) {
        lastProposalInDb = proposal.start_block_height;
      }
    }
  }

  if (proposalsToUseInReply.length === 0) {
    lastProposalInDb = lastBlockInNetwork;
  } else {
    reply = await model.parseNewProposalsSummary(proposalsToUseInReply);
  }
  db.lastBlockHeightCheckedForProposals = lastProposalInDb;
  model.writeDb(db);

  useLog("Task result: running checkNetworkProposals.");
  useLog(reply);
  return reply;
}
async function cleanOldLogs() {
  //
  //
  const logFolder = customPath(LOG_PATH);
  useLog("Running task: cleanOldLogs()");
  fs.readdir(logFolder, (err, files) => {
    if (err) {
      useLog(
        `Unable to read log folder in '${logFolder}' to delete old files.`
      );
    }

    let oldFiles = files
      .sort((a, b) => {
        return (
          parseInt(
            a
              .split("-")
              .slice(-1)
              .slice(-1)[0]
          ) -
          parseInt(
            b
              .split("-")
              .slice(-1)
              .slice(-1)[0]
          )
        );
      })
      .slice(0, -1);

    if (oldFiles.length === 0) {
      useLog("No files found to delete in logs/ folder");
    } else {
      useLog(
        `Trying to delete the folowing files in logs/ folder: ${oldFiles}`
      );
      oldFiles.forEach(fileName => {
        fs.unlink(logFolder + fileName, err => {
          if (err) {
            useLog(
              `Error while trying to delete file ${logFolder + fileName}.`
            );
            useLog(err);
          } else {
            useLog(`Successfully deleted file: ${logFolder + fileName}.`);
          }
        });
      });
    }
  });
}

async function recursiveTask(task, sendMsgHandler, interval) {
  let db = model.readDb();
  if (db.report.length > 0) {
    useLog(
      `Running recursive task every ${interval} ms. Users to report for this task are: `,
      db.report
    );
    let taskResult = await task();
    sendMsgHandler(taskResult);
  } else {
    useLog("No users added to the report list, skipping recursive task");
  }
}

module.exports = {
  checkMonitoredNodesTask: checkMonitoredNodesTask,
  INTERVALS: INTERVALS,
  compareGoloopVersionsTask: compareGoloopVersionsTask,
  recursiveTask: recursiveTask,
  checkNetworkProposals: checkNetworkProposals,
  cleanOldLogs: cleanOldLogs
};
