// imports
const { Scenes } = require("telegraf");
const { customPath } = require("../services");
const { model } = require("../model");
const {
  updateUsersDb,
  readUsersDb,
  checkUsersDb,
  nodeExistsInDb,
  removeNodeFromDb
} = model;
const fs = require("fs");

const STRINGS = JSON.parse(fs.readFileSync(customPath("data/strings.json")));

const MONITOR_PATH = "data/monitor.json";

// Functions
function updateMonitorFile(update) {
  try {
    fs.writeFileSync(customPath(MONITOR_PATH), JSON.stringify(update));
  } catch (err) {
    console.log("error while updating monitor.json");
    console.log(err);
  }
}

function initializeSession(node = null, nodesArray) {
  let session = {
    hasInitialized: true,
    monitored: [],
    nodes: nodesArray
  };
  if (node !== null) {
    session.monitored.push(node);
  }
  return session;
}

function removeNodeFromMonitoredByIp(ip, monitoredArray) {
  let newMonitoredArray = [];
  monitoredArray.forEach(node => {
    if (node.ip === ip) {
      //do nothing
    } else {
      newMonitoredArray.push(node);
    }
  });

  return newMonitoredArray;
}

function validateIp(ip) {
  let regex = new RegExp("^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(.|$)){4}$");

  return regex.test(ip);
}
// Bot wizard scene
const addNodeWizard = new Scenes.WizardScene(
  STRINGS.actions.add.label,
  ctx => {
    // Wizard step 1

    // check users database (users.json)
    ctx.session = checkUsersDb(ctx.session, ctx.from.id);

    ctx.reply("enter a name for the node you want to monitor");
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  ctx => {
    // Wizard step 2
    if (ctx.message.text.length < 1) {
      ctx.reply("Please enter a valid name");
      return;
    }
    ctx.wizard.state.data.name = ctx.message.text;
    ctx.reply("Please enter IP address of the node you want to monitor");
    return ctx.wizard.next();
  },
  async ctx => {
    // Wizard step 3

    if (!validateIp(ctx.message.text)) {
      ctx.reply("Please enter valid IP address");
      return;
    }

    ctx.wizard.state.data.ip = ctx.message.text;
    if (ctx.session.hasInitialized === true) {
      ctx.session[ctx.from.id].monitored.push({
        name: ctx.wizard.state.data.name,
        ip: ctx.wizard.state.data.ip
      });
    } else {
      ctx.session[ctx.from.id] = initializeSession({
        name: ctx.wizard.state.data.name,
        ip: ctx.wizard.state.data.ip
      });
    }

    // update users database (users.json)
    updateUsersDb(ctx.from.id, ctx.session[ctx.from.id]);

    // TODO: merge users.json and monitors.json into a single database
    updateMonitorFile(ctx.session);
    ctx.reply(
      `You have successfully added a node.\nNode name: ${ctx.wizard.state.data.name}\nNode IP: ${ctx.wizard.state.data.ip}`
    );
    return ctx.scene.leave();
  }
);
const editNodesWizard = new Scenes.WizardScene(
  STRINGS.actions.edit.label,
  ctx => {
    // Wizard step 1

    // check user database (users.json)
    ctx.session = checkUsersDb(ctx.session, ctx.from.id);
    if (
      ctx.session[ctx.from.id].hasInitialized &&
      ctx.session[ctx.from.id].monitored.length > 0
    ) {
      // If nodes have been added to be monitored show them and ask user
      // to select one
      let reply =
        "Please reply with the ip of the node you want to remove:\n\n";
      for (let node of ctx.session[ctx.from.id].monitored) {
        reply = reply + `Node name: ${node.name}\nNode ip: ${node.ip}\n\n`;
      }
      ctx.reply(reply);
    } else {
      // if no node have been added print message and leave wizard
      ctx.reply(STRINGS.msg2);
      return ctx.scene.leave();
    }
    // put here the logic of showing the nodes to then delete
    return ctx.wizard.next();
  },
  ctx => {
    // Wizard step 2
    if (nodeExistsInDb(ctx.message.text, ctx.session[ctx.from.id].monitored)) {
      let newDb = removeNodeFromDb(
        ctx.message.text,
        ctx.session[ctx.from.id].monitored
      );
      ctx.session[ctx.from.id].monitored = newDb;
      ctx.reply("Node successfully removed from list of monitored nodes");

      // LEGACY
      ctx.session.monitored = removeNodeFromMonitoredByIp(
        ctx.message.text,
        ctx.session.monitored
      );
      // LEGACY
    } else {
      ctx.reply(
        "The data you entered doesnt match the list of monitored nodes"
      );
    }
    if (ctx.session.monitored[ctx.from.id].length === 0) {
      ctx.session.hasInitialized = false;
    }

    updateUsersDb(ctx.from.id, ctx.session[ctx.from.id]);

    // LEGACY
    updateMonitorFile(ctx.session);
    // LEGACY
    return ctx.scene.leave();
  }
);

const checkNodesWizard = new Scenes.WizardScene(
  STRINGS.actions.check.label,
  ctx => {
    // Wizard step 1

    // check users database (users.json)
    ctx.session = checkUsersDb(ctx.session, ctx.from.id);
    if (
      ctx.session[ctx.from.id].hasInitialized &&
      ctx.session[ctx.from.id].monitored.length > 0
    ) {
      let reply = "Nodes being monitored:\n\n";
      for (let node of ctx.session[ctx.from.id].monitored) {
        reply = reply + `Node name: ${node.name}\nNode ip: ${node.ip}\n\n`;
      }
      ctx.reply(reply);
    } else {
      ctx.reply(STRINGS.msg2);
    }
    return ctx.scene.leave();
  }
);

const addTaskWizard = new Scenes.WizardScene(
  STRINGS.actions.add_task.label,
  ctx => {
    ctx.reply("add task button clicked");
    return ctx.scene.leave();
  }
);
const editTaskWizard = new Scenes.WizardScene(
  STRINGS.actions.edit_task.label,
  ctx => {
    ctx.reply("edit task button clicked");
    return ctx.scene.leave();
  }
);
const checkTaskWizard = new Scenes.WizardScene(
  STRINGS.actions.check_task.label,
  ctx => {
    ctx.reply("check task button clicked");
    return ctx.scene.leave();
  }
);
module.exports = {
  addNodeWizard: addNodeWizard,
  editNodesWizard: editNodesWizard,
  checkNodesWizard: checkNodesWizard,
  addTaskWizard: addTaskWizard,
  editTaskWizard: editTaskWizard,
  checkTaskWizard: checkTaskWizard
};
