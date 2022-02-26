// tasks.test.js
const { tasks } = require("../../services");
const { botReplyMaker } = require("../../bot");
// test on version check task;

async function versionCheckTask() {
  let result = await tasks.compareGoloopVersionsTask();

  let reply = botReplyMaker.makeVersionCheckReply(result);
  if (reply == null) {
    console.log("Skipping versionCheck");
  } else {
    console.log(reply);
  }
}

versionCheckTask();
