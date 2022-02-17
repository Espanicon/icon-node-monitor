// imports
const { Scenes } = require("telegraf");
const { customPath, lib } = require("../services");
const { model } = require("../model");

const fs = require("fs");

const STRINGS = model.getStrings();

// Functions
function addEachUserToReply(msg, listOfUsers) {
  let reply = msg;
  for (let userToReport of listOfUsers) {
    reply += `@${userToReport.username}\n\n`;
  }
  return reply;
}
function readDbAndCheckForAdmin(currentUser) {
  // read db
  db = model.readDb();
  if (db.admin.id == null || db.admin.username == null) {
    // if bot admin havent been set
    model.addBotAdmin(currentUser);
  }
  // return new read on db to account for an update on admin status
  return model.readDb();
}

// Bot wizard scene
const addNodeWizard = new Scenes.WizardScene(
  STRINGS.actions.add.label,
  ctx => {
    // Wizard step 1
    ctx.session.db = readDbAndCheckForAdmin(ctx.from);
    // TODO: place here logic that only admin can add nodes
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

    if (!lib.validateIp(ctx.message.text)) {
      ctx.reply("Please enter valid IP address");
      return;
    }

    // update db
    ctx.wizard.state.data.ip = ctx.message.text;
    let reply = model.updateDbMonitored(ctx.wizard.state.data, "ADD");

    ctx.reply(reply);
    return ctx.scene.leave();
  }
);
const editNodesWizard = new Scenes.WizardScene(
  STRINGS.actions.edit.label,
  ctx => {
    // Wizard step 1
    // Load db
    ctx.session.db = readDbAndCheckForAdmin(ctx.from);
    if (
      ctx.session.db.locked === true &&
      ctx.from.id != ctx.session.db.admin.id
    ) {
      // Bot admin is the only one that can delete nodes from monitoring
      ctx.reply(
        `Only the bot admin can edit the list of nodes being monitored, currently the bot admin is @${ctx.session.db.admin.username}. Contact bot admin if you want to edit the list of nodes being monitored.`
      );
      return ctx.scene.leave();
    } else {
      // the bot state is not locked and the current user is anyone, or the bot
      // is locked and the current user is the admin
      // either way the current user can edit the list of nodes
      //
      if (ctx.session.db.monitored.length > 0) {
        // If nodes have been added to be monitored show them and ask user
        // to select one
        let reply =
          "Please reply with the ip or name of the node you want to remove:\n\n";
        for (let node of ctx.session.db.monitored) {
          reply += `Node name: ${node.name}\nNode ip: ${node.ip}\n\n`;
        }
        ctx.reply(reply);
      } else {
        // if no node have been added print message and leave wizard
        ctx.reply(STRINGS.msg2);
        return ctx.scene.leave();
      }
    }
    return ctx.wizard.next();
  },
  ctx => {
    // Wizard step 2

    // TODO: maybe find a better solution than setting both data.name and
    // data.ip equal to ctx.message.text
    ctx.wizard.state.data = { name: ctx.message.text, ip: ctx.message.text };
    let reply = model.updateDbMonitored(ctx.wizard.state.data, "DELETE");
    ctx.reply(reply);
    return ctx.scene.leave();
  }
);

const checkNodesWizard = new Scenes.WizardScene(
  STRINGS.actions.check.label,
  ctx => {
    // Wizard step 1
    ctx.session.db = readDbAndCheckForAdmin(ctx.from);
    if (ctx.session.db.monitored.length > 0) {
      let reply = "Nodes being monitored:\n\n";
      for (let node of ctx.session.db.monitored) {
        reply += `Node name: ${node.name}\nNode ip: ${node.ip}\n\n`;
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
    ctx.session.db = readDbAndCheckForAdmin(ctx.from);
    ctx.reply(
      "Because of limitations with how Telegram bots work, to add a user to the list of entities that will get node status report, is necessary to send the command '/addMeToReport' via private chat to the bot or by the bot admin in a chat group."
    );
    return ctx.scene.leave();
  }
);
const editTaskWizard = new Scenes.WizardScene(
  STRINGS.actions.edit_task.label,
  ctx => {
    ctx.session.db = readDbAndCheckForAdmin(ctx.from);
    if (
      ctx.session.db.locked === true &&
      ctx.from.id != ctx.session.db.admin.id
    ) {
      // Bot admin is the only one that can delete nodes from monitoring
      ctx.reply(
        `The bot is currently locked and only the bot admin can edit the list of users in the report list, currently the bot admin is @${ctx.session.db.admin.username}. Contact bot admin if you want to edit the list.`
      );
      return ctx.scene.leave();
    } else {
      // the bot state is not locked and the current user is anyone, or the bot
      // is locked and the current user is the admin
      // either way the current user can edit the list of nodes
      if (ctx.session.db.report.length > 0) {
        // If users have been added to to the report list show them and ask user
        // to select one or more of them to delete
        let reply = "";
        reply += addEachUserToReply(STRINGS.msg6, ctx.session.db.report);
        ctx.reply(reply);
      } else {
        // if no user has been added to the list
        ctx.reply(STRINGS.msg5);
        return ctx.scene.leave();
      }
    }
    return ctx.wizard.next();
  },
  ctx => {
    let usersToRemove = ctx.message.text;
    // TODO: possible infinite loop if no correct reply is given, test if
    // loop variable increments
    let loops = 0;
    if (lib.validateUserList(usersToRemove) === false) {
      // if the input is not a valid list of users separated by spaces
      ctx.reply(
        "The previous input is not valid, please send one or more users separated by spaces (i.e '@user1 @user2')"
      );
      loops += 1;
      console.log(loops);
      return;
    } else {
      // if the list of users is valid, check their existance in the report list
      // and remove them
      let reply = model.removeUsersFromDbReport(ctx.message.text);
      ctx.reply(reply);
    }
    return ctx.scene.leave();
    //TODO: test adding and deleting users from the report list
  }
);
const checkTaskWizard = new Scenes.WizardScene(
  STRINGS.actions.check_task.label,
  ctx => {
    ctx.session.db = readDbAndCheckForAdmin(ctx.from);
    let reply = "";
    if (ctx.session.db.report.length > 0) {
      reply += addEachUserToReply(STRINGS.msg7, ctx.session.db.report);
      ctx.reply(reply);
    } else {
      ctx.reply(STRINGS.msg5);
    }
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
