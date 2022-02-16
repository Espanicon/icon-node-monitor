// cronSchedule.js
//
const fs = require("fs");
const { customPath } = require("../services");
const STRINGS = JSON.parse(fs.readFileSync(customPath("data/strings.json")));

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
  tenMinutes: 600000
};
const MAX_ALLOWED_BLOCK_GAP = 100;
const STATE_PATH = "data/state.json";
const MONITOR_PATH = "data/db.json";
const PREPS_PATH = "data/preps.json";

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
    // if alert foes from on to off
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

async function checkMonitoredNodesTask(botContext, botId, makeCheck) {
  let nodesFileExists = fs.existsSync(customPath(PREPS_PATH));
  let monitorFileExists = fs.existsSync(customPath(MONITOR_PATH));

  if (nodesFileExists && monitorFileExists) {
    const nodes = JSON.parse(fs.readFileSync(customPath(PREPS_PATH), "utf8"));
    const monitored = JSON.parse(
      fs.readFileSync(customPath(MONITOR_PATH), "utf8")
    );
    if (monitored.monitored.length > 0) {
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
        const data = await makeCheck(nodes.NODES_ARRAY, monitored.monitored);
        for (let eachNode of data.nodes) {
          for (let eachMonitor of monitored.monitored) {
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
          botContext(botId, reply);
        }
      } catch (err) {
        console.log("error running task");
        console.log(err);
      }
    } else {
      console.log("No nodes have been added to monitor, bypassing cron check");
    }
  } else {
    // Monitor and Preps files dont exists so we dont run the check
    console.log(
      "monitor.json and preps.json file havent been created, bypassing cron check"
    );
  }
}

exports.checkMonitoredNodesTask = checkMonitoredNodesTask;
exports.INTERVALS = INTERVALS;
