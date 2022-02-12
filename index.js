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
function initializeSession(node = null) {
  let session = {
    hasInitialized: true,
    monitored: []
  };
  if (node !== null) {
    session.monitored.push(node);
  }
  return session;
}

// Bot wizard scene
const addNodeWizard = customScenes.addNodeWizard;
const checkNodesWizard = customScenes.checkNodesWizard;
const editNodesWizard = customScenes.editNodesWizard;

// creating new Bot instance
const espaniconBot = new Telegraf(BOT_TOKEN);
const stage = new Scenes.Stage([
  addNodeWizard,
  checkNodesWizard,
  editNodesWizard
]);
espaniconBot.use(session());
espaniconBot.use(stage.middleware());

// Bot actions
espaniconBot.action(STRINGS.actions.add.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.add.label);
});
espaniconBot.action(STRINGS.actions.check.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.check.label);
});
espaniconBot.action(STRINGS.actions.edit.tag, (ctx, next) => {
  ctx.scene.enter(STRINGS.actions.edit.label);
});

// bot commands
// start command
espaniconBot.command("start", ctx => {
  ctx.reply(
    STRINGS.msg1,
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
// /info command
espaniconBot.command("/info", ctx => {
  ctx.reply(STRINGS.infoCmdString);
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
function botSendMsgFunction(groupId, reply) {
  espaniconBot.telegram.sendMessage(groupId, reply);
}

// Running recursive check with setTimeout
function runEveryMinute() {
  tasks.checkMonitoredNodesTask(
    botSendMsgFunction,
    GROUP_ID,
    botCommands.checkMonitoredAndBlockProducersHeight
  );

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
  }
  if (killApp) {
    process.exit(1);
  }
});

// Enable graceful stop
process.once("SIGINT", () => espaniconBot.stop("SIGINT"));
process.once("SIGTERM", () => espaniconBot.stop("SIGTERM"));
