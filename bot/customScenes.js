// imports
const { Scenes } = require("telegraf");
const { customPath } = require("../services");
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
    let parsedPreps = [];
    // try {
    //   parsedPreps = await getPreps(ctx.message.text);
    // } catch (err) {
    //   console.log("error:");
    //   console.log(err);
    // }

    if (!validateIp(ctx.message.text)) {
      ctx.reply("Please enter valid IP address");
      return;
    }

    ctx.wizard.state.data.ip = ctx.message.text;
    if (ctx.session.hasInitialized === true) {
      ctx.session.monitored.push({
        name: ctx.wizard.state.data.name,
        ip: ctx.wizard.state.data.ip
      });
    } else {
      ctx.session = initializeSession(
        {
          name: ctx.wizard.state.data.name,
          ip: ctx.wizard.state.data.ip
        },
        parsedPreps //This is an error cuz is an empty array
      );
    }
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
    if (ctx.session.hasInitialized === true) {
      // If nodes have been added to be monitored show them and ask user
      // to select one
      let reply =
        "Please reply with the ip of the node you want to remove:\n\n";
      for (let node of ctx.session.monitored) {
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
    let removeNode = false;
    for (let node of ctx.session.monitored) {
      if (node.ip === ctx.message.text) {
        removeNode = true;
      }
    }
    if (removeNode) {
      // remove node
      ctx.session.monitored = removeNodeFromMonitoredByIp(
        ctx.message.text,
        ctx.session.monitored
      );
      let reply = "You have successfully removed the node.";
      ctx.reply(reply);
    } else {
      // if the ip send by the user is not on the list of monitored
      ctx.reply("The ip you entered doesnt match the list of monitored nodes");
    }
    if (ctx.session.monitored.length === 0) {
      ctx.session.hasInitialized = false;
    }
    updateMonitorFile(ctx.session);
    return ctx.scene.leave();
  }
);

const checkNodesWizard = new Scenes.WizardScene(
  STRINGS.actions.check.label,
  ctx => {
    // Wizard step 1
    if (ctx.session.hasInitialized === true) {
      let reply = "Nodes being monitored:\n\n";
      for (let node of ctx.session.monitored) {
        reply = reply + `Node name: ${node.name}\nNode ip: ${node.ip}\n\n`;
      }
      ctx.reply(reply);
    } else {
      ctx.reply(STRINGS.msg2);
    }
    return ctx.scene.leave();
  }
);

exports.addNodeWizard = addNodeWizard;
exports.editNodesWizard = editNodesWizard;
exports.checkNodesWizard = checkNodesWizard;
