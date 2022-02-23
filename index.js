// imports
require("dotenv").config();
const { Telegraf, session, Markup, Scenes } = require("telegraf");
const fs = require("fs");
const { botCommands, botReplyMaker, customScenes } = require("./bot");
const { customPath, tasks } = require("./services");
const { model } = require("./model");

// global constants
const BOT_TOKEN = process.env.BOT_TOKEN;
const STRINGS = model.getStrings();
const _DB_ = "data/db.json";

if (!BOT_TOKEN || BOT_TOKEN == null) {
  throw "Critical error, there is no bot auth token on '.env' file.";
}

// Functions
// creating new Bot instance
const iconNodeMonitorBot = new Telegraf(BOT_TOKEN);
const stage = new Scenes.Stage([
  customScenes.addNodeWizard,
  customScenes.checkNodesWizard,
  customScenes.editNodesWizard,
  customScenes.addTaskWizard,
  customScenes.editTaskWizard,
  customScenes.checkTaskWizard
]);
iconNodeMonitorBot.use(session());
iconNodeMonitorBot.use(stage.middleware());

// Bot actions
// BEGIN NODES BUTTON STRUCTURE
iconNodeMonitorBot.action(STRINGS.actions.nodes.tag, (ctx, next) => {
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
iconNodeMonitorBot.action(STRINGS.actions.add.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.add.label);
});
iconNodeMonitorBot.action(STRINGS.actions.check.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.check.label);
});
iconNodeMonitorBot.action(STRINGS.actions.edit.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.edit.label);
});
// END NODES BUTTON STRUCTURE

// BEGIN REPORT BUTTON STRUCTURE
iconNodeMonitorBot.action(STRINGS.actions.task.tag, (ctx, next) => {
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
iconNodeMonitorBot.action(STRINGS.actions.add_task.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.add_task.label);
});
iconNodeMonitorBot.action(STRINGS.actions.check_task.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.check_task.label);
});
iconNodeMonitorBot.action(STRINGS.actions.edit_task.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.edit_task.label);
});
// END REPORT BUTTON STRUCTURE

// bot commands
// /test command
iconNodeMonitorBot.command("/test", async ctx => {
  let commands = await ctx.telegram.botCommandsScopeChat;
  console.log(commands);
});
// start command
iconNodeMonitorBot.command("start", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  ctx.replyWithMarkdownV2(
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
iconNodeMonitorBot.command("/info", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  ctx.reply(STRINGS.infoCmdString);
});
// /addMeToReport command
iconNodeMonitorBot.command("/addMeToReport", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let reply = botCommands.addMeToReport(ctx.from);
  ctx.reply(reply);
});
// /addGroupToReport Command
iconNodeMonitorBot.command("/addGroupToReport", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let reply = botCommands.addGroupToReport(ctx.chat, ctx.from);
  ctx.reply(reply);
});
// /unlock command
iconNodeMonitorBot.command("/unlock", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let reply = botCommands.unlock(ctx.from);
  ctx.reply(reply);
});
// /lock command
iconNodeMonitorBot.command("/lock", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let reply = botCommands.lock(ctx.from);
  ctx.reply(reply);
});
// /testReport command
iconNodeMonitorBot.command("/testReport", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let reply = botCommands.testReport(db);
  for (let eachUser of db.report) {
    ctx.telegram.sendMessage(eachUser.id, reply);
  }
});
// /showListOfMonitored command. maybe an unnecesary command?
iconNodeMonitorBot.command("/showListOfMonitored", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let reply = botCommands.showListOfMonitored(db);
  ctx.reply(reply);
});
// /summary command
// TODO: implement a command that shows a summary of all monitored nodes
// * shows IP
// * shows goloop version running
// * shows name that user gave the node
// * shows current block height
//
iconNodeMonitorBot.command("/summary", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  ctx.reply("Command /summary sent but is not yet implemented");
});
// /versionCheck {start || stop || pause} command
// TODO: implement a state for the versionCheck command
iconNodeMonitorBot.hears(/^(\/\w+\s+(start|stop|pause))$/, ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);

  let command = ctx.message.text.split(" ");
  if (command[0].substring(1) === "versionCheck") {
    // Command /versionCheck sent by user
    console.log(`Command sent by user: ${command[0]} ${command[1]}`);
    if (command[1] === "start") {
      ctx.reply("command '/versionCheck start' sent but not yet implemented");
    } else if (command[1] === "stop") {
      ctx.reply("command '/versionCheck stop' sent but not yet implemented");
    } else if (command[1] === "pause") {
      ctx.reply("command '/versionCheck pause' sent but not yet implemented");
    } else {
      // this condition should never happen because the regex should only match
      // start || stop || pause
    }
  }
});
// /checkMonitoredAndBlockProducersHeight command
iconNodeMonitorBot.command(
  "checkMonitoredAndBlockProducersHeight",
  async ctx => {
    ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
    const data = await botCommands.checkMonitoredAndBlockProducersHeight();
    const reply = botReplyMaker.makeNodesHeightAndGapReply(data);
    ctx.reply(reply);
  }
);
// /updatePrepsList command
iconNodeMonitorBot.command("/updatePrepsList", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  botCommands.updatePrepsList();
  ctx.reply("List of Preps was updated");
});
// /showListOfPreps command
iconNodeMonitorBot.command("/showListOfPreps", ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let data = botCommands.showListOfPreps();
  let reply = botReplyMaker.makeUpdateListOfPrepsReply(data);
  ctx.reply(reply);
});

// /checkBlockProducersHeight command
iconNodeMonitorBot.command("checkBlockProducersHeight", async ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let data = await botCommands.checkBlockProducersHeight();
  let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
  ctx.reply(reply);
});
// /checkMonitoredHeight command
iconNodeMonitorBot.command("checkMonitoredNodesHeight", async ctx => {
  ctx.session.db = model.readDbAndCheckForAdmin(ctx.from);
  let data = await botCommands.checkMonitoredNodesHeight();
  let reply = botReplyMaker.makeNodesHeightAndGapReply(data);
  ctx.reply(reply);
});

// Running the bot
iconNodeMonitorBot.launch();

// Function to send message to TG group
function botSendMsgFunction(arrayOfUsersToReport, reply) {
  for (let eachUserToReport of arrayOfUsersToReport) {
    iconNodeMonitorBot.telegram.sendMessage(eachUserToReport.id, reply);
  }
}

// TODO: implement recursive check every hour for goloop version
// Running recursive block check every minute
function runEveryMinute() {
  if (fs.existsSync(customPath(_DB_))) {
    let db = JSON.parse(fs.readFileSync(customPath(_DB_)));
    if (db.report.length > 0) {
      console.log(
        "Running recursive task every minute. users to report in case of node issues are: ",
        db.report
      );
      tasks.checkMonitoredNodesTask(
        botSendMsgFunction,
        db.report,
        botCommands.checkMonitoredAndBlockProducersHeight
      );
    } else {
      console.log("No users added to report list, skipping recursive check");
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

// TODO: can also implement bot.catch(err => {})
process.on("uncaughtException", err => {
  let killApp = true;
  if (isTelegramErrorType(err)) {
    console.log("Unexpected error of type 'TelegramError'.", err);
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
process.once("SIGINT", () => iconNodeMonitorBot.stop("SIGINT"));
process.once("SIGTERM", () => iconNodeMonitorBot.stop("SIGTERM"));
