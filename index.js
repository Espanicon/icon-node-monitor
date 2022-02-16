// imports
require("dotenv").config();
const { Telegraf, session, Markup, Scenes } = require("telegraf");
const fs = require("fs");
const { botCommands, botReplyMaker, customScenes } = require("./bot");
const { syncGetPreps, customPath, tasks } = require("./services");

// global constants
const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;
const STRINGS = JSON.parse(fs.readFileSync(customPath("data/strings.json")));
let PREPS = [];
try {
  if (fs.existsSync(customPath("data/preps.json"))) {
    // if the file 'data/preps.json' exists
    PREPS = JSON.parse(fs.readFileSync(customPath("/data/preps.json")));
  } else {
    // if it doesnt exists, create it
    syncGetPreps("./data/preps.json");
    PREPS = JSON.parse(fs.readFileSync(customPath("/data/preps.json")));
  }
} catch (err) {
  // if there is some error processing the 'data/preps.json' file
  // this throw statement will kill the program because it will be
  // an unhandle exception
  throw "Error while processing 'data/preps.json' file";
}

// Functions

// creating new Bot instance
const espaniconBot = new Telegraf(BOT_TOKEN);
const stage = new Scenes.Stage([
  customScenes.addNodeWizard,
  customScenes.checkNodesWizard,
  customScenes.editNodesWizard,
  customScenes.addTaskWizard,
  customScenes.editTaskWizard,
  customScenes.checkTaskWizard
]);
espaniconBot.use(session());
espaniconBot.use(stage.middleware());

// Bot actions
// BEGIN NODES BUTTON STRUCTURE
espaniconBot.action(STRINGS.actions.nodes.tag, (ctx, next) => {
  ctx.reply(
    STRINGS.msg3,
    Markup.inlineKeyboard([
      Markup.button.callback(STRINGS.actions.add.msg, STRINGS.actions.add.tag),
      Markup.button.callback(
        STRINGS.actions.edit.msg,
        STRINGS.actions.edit.tag
      ),
      Markup.button.callback(
        STRINGS.actions.check.msg,
        STRINGS.actions.check.tag
      )
    ])
  );
});
espaniconBot.action(STRINGS.actions.add.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.add.label);
});
espaniconBot.action(STRINGS.actions.check.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.check.label);
});
espaniconBot.action(STRINGS.actions.edit.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.edit.label);
});
// END NODES BUTTON STRUCTURE

// BEGIN REPORT BUTTON STRUCTURE
espaniconBot.action(STRINGS.actions.task.tag, (ctx, next) => {
  ctx.reply(
    STRINGS.msg4,
    Markup.inlineKeyboard([
      Markup.button.callback(
        STRINGS.actions.add_task.msg,
        STRINGS.actions.add_task.tag
      ),
      Markup.button.callback(
        STRINGS.actions.edit_task.msg,
        STRINGS.actions.edit_task.tag
      ),
      Markup.button.callback(
        STRINGS.actions.check_task.msg,
        STRINGS.actions.check_task.tag
      )
    ])
  );
});
espaniconBot.action(STRINGS.actions.add_task.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.add_task.label);
});
espaniconBot.action(STRINGS.actions.check_task.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.check_task.label);
});
espaniconBot.action(STRINGS.actions.edit_task.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.edit_task.label);
});
// END NODES BUTTON STRUCTURE

// bot commands
// start command
espaniconBot.command("start", ctx => {
  ctx.reply(
    STRINGS.msg1,
    Markup.inlineKeyboard([
      Markup.button.callback(
        STRINGS.actions.nodes.msg,
        STRINGS.actions.nodes.tag
      ),
      Markup.button.callback(STRINGS.actions.task.msg, STRINGS.actions.task.tag)
    ])
  );
});
// /info command
espaniconBot.command("/info", ctx => {
  ctx.reply(STRINGS.infoCmdString);
});
// /addMeToReport command
espaniconBot.command("/addMeToReport", ctx => {
  let reply = botCommands.addMeToReport(ctx.from);
  ctx.reply(reply);
});
// /showListOfMonitored command
espaniconBot.command("/showListOfMonitored", ctx => {
  ctx.reply("Command /showListOfMonitored sent but is not yet implemented");
});
// /checkMonitoredAndBlockProducersHeight command
espaniconBot.command("checkMonitoredAndBlockProducersHeight", async ctx => {
  if (ctx.session.hasInitialized === true) {
    let data = await botCommands.checkMonitoredAndBlockProducersHeight(
      PREPS.NODES_ARRAY,
      ctx.session.monitored
    );

    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    ctx.reply(reply);
  } else {
    ctx.reply(STRINGS.msg2);
  }
});
// /updatePrepsList command
espaniconBot.command("/updatePrepsList", ctx => {
  botCommands.updatePrepsList();
  ctx.reply("List of Preps was updated");
});
// /showListOfPreps command
espaniconBot.command("/showListOfPreps", ctx => {
  let data = botCommands.showListOfPreps();
  let reply = botReplyMaker.makeUpdateListOfPrepsReply(data);
  ctx.reply(reply);
});

// /checkBlockProducersHeight command
espaniconBot.command("checkBlockProducersHeight", async ctx => {
  if (ctx.session.hasInitialized === true) {
    let data = await botCommands.checkBlockProducersHeight(PREPS.NODES_ARRAY);

    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    ctx.reply(reply);
  } else {
    ctx.reply(STRINGS.msg2);
  }
});
// /checkMonitoredHeight command
espaniconBot.command("checkMonitoredNodesHeight", async ctx => {
  if (ctx.session.hasInitialized === true) {
    let data = await botCommands.checkMonitoredNodesHeight(
      ctx.session.monitored
    );

    let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    ctx.reply(reply);
  } else {
    ctx.reply(STRINGS.msg2);
  }
});

// Running the bot
espaniconBot.launch();

// Function to send message to TG group
function botSendMsgFunction(arrayOfUsersToReport, reply) {
  for (let eachUserToReport of arrayOfUsersToReport) {
    espaniconBot.telegram.sendMessage(eachUserToReport.id, reply);
  }
}

// Running recursive check with setTimeout
function runEveryMinute() {
  if (fs.existsSync(customPath("data/db.json"))) {
    let db = JSON.parse(fs.readFileSync(customPath("data/db.json")));
    console.log(
      "Running recursive task every minute. users to report in case of node issues are: ",
      db.report
    );
    if (db.report.length > 0) {
      tasks.checkMonitoredNodesTask(
        botSendMsgFunction,
        db.report,
        botCommands.checkMonitoredAndBlockProducersHeight
      );
    }
  }

  setTimeout(runEveryMinute, tasks.INTERVALS.oneMinute);
}
setTimeout(runEveryMinute, tasks.INTERVALS.oneMinute);

// Catching uncaught exceptions
//
function isTelegramErrorType(error) {
  try {
    let constructorString = error.constructor.toString();
    if (constructorString.includes("TelegramError")) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log("Error while getting constructor", err);
  }
}
process.on("uncaughtException", err => {
  let killApp = true;
  if (isTelegramErrorType(err)) {
    console.log(
      "Unexpected error of type 'TelegramError'. Make sure the GROUP_ID value is valid in the '.env' file\n",
      err
    );
    killApp = true;
  } else {
    console.log("uncaughtException : ", err);
    process.exit(1);
  }
  if (killApp) {
    process.exit(1);
  }
});

// Enable graceful stop
process.once("SIGINT", () => espaniconBot.stop("SIGINT"));
process.once("SIGTERM", () => espaniconBot.stop("SIGTERM"));
