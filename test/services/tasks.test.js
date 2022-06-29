// tasks.test.js
const { tasks } = require("../../services");
const { botReplyMaker } = require("../../bot");
// test on version check task;

async function versionCheckTask() {
  // let result = await tasks.compareGoloopVersionsTask();
  // let reply = botReplyMaker.makeVersionCheckReply(result);
  // if (reply == null) {
  //   console.log("Skipping versionCheck");
  // } else {
  //   console.log(reply);
  // }

  // network proposals test
  let result = await tasks.checkNetworkProposals();
  if (result === null) {
    console.log("skipping task");
  } else {
    console.log(result);
  }
}

versionCheckTask();
