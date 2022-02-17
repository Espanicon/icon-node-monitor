// model/model.js
const fs = require("fs");
const customPath = require("../services/customPath.js");
const syncGetPreps = require("../services/syncGetPreps.js");
const lib = require("../services/lib.js");

const _DB_ = "data/db.json";
const _PREPS_ = "data/preps.json";
const _STRINGS_ = "data/strings.json";

// functions
function dbInitState() {
  /*
   * monitored: [{name: string, ip: number}]
   * report: [{id: number, username: string}]
   * admin: { id: number, username: string}}
   * state: { locked: bool }
   */
  return {
    monitored: [],
    report: [],
    admin: { id: null, username: null },
    state: { locked: false }
  };
}
function getStrings() {
  let strings = null;
  try {
    strings = JSON.parse(fs.readFileSync(customPath(_STRINGS_)));
    return strings;
  } catch (err) {
    console.log("Error while processing 'data/strings.json' file", err);
    // this file is critical so if it doesnt exists throw an exception to kill app
    throw "CRITICAL ERROR: there was an error while processing strings.json file";
  }
}

function updatePrepsList() {
  // rebuilds the preps.json file
  syncGetPreps(customPath(_PREPS_));
}

function getListOfPreps() {
  let preps = null;
  try {
    preps = JSON.parse(fs.readFileSync(customPath(_PREPS_)));
  } catch (err) {
    console.log("Error while reading data/preps.json", err);
    console.log("Creating new list of preps");
    updatePrepsList();
    preps = JSON.parse(fs.readFileSync(customPath(_PREPS_)));
  }
  return preps;
}
function prepsFileExists() {
  return fs.existsSync(customPath(_PREPS_));
}
function monitoredNodesExists() {
  return readDb().monitored.length > 0 ? true : false;
}
function addBotAdmin(ctxFrom) {
  let db = readDb();
  if (db.state.locked === false) {
    db.admin.id = ctxFrom.id;
    db.admin.username = ctxFrom.username;
    db.state.locked = true;
    writeDb(db);
    console.log(`Successfully added user ${db.admin.username} as bot admin`);
  } else {
    console.log(
      `Current user was not added as admin because the bot admin state is currently locked and admin was already added. Current bot admin is ${db.admin.username}`
    );
  }
}

function readDb() {
  if (fs.existsSync(customPath(_DB_))) {
    return JSON.parse(fs.readFileSync(customPath(_DB_)));
  } else {
    let firstState = dbInitState();
    fs.writeFileSync(customPath(_DB_), JSON.stringify(firstState));
    return firstState;
  }
}

function writeDb(data) {
  fs.writeFileSync(customPath(_DB_), JSON.stringify(data));
}
/*
 * Remove one or more users from the report list in the database
 * @param {string} validatedStringOfUsers
 */
function removeUsersFromDbReport(validStringOfUsers) {
  let parsedListOfUsers = lib.parseUserList(validStringOfUsers);
  console.log(
    `Removing the following users from the database: ${parsedListOfUsers}`
  );
  let newListOfUsers = [];
  let deletedUsers = [];
  let db = readDb();
  for (let eachUser of db.report) {
    if (parsedListOfUsers.includes(eachUser.username)) {
      // the user exists inside the database.
      deletedUsers.push(eachUser);
    } else {
      newListOfUsers.push(eachUser);
    }
  }
  db.report = newListOfUsers;
  writeDb(db);
  console.log(
    `Users successfully removed from list, updated list contains the following users: ${db.report}`
  );

  // database has been updated now create reply to pass to the bot
  let reply = "";
  if (deletedUsers.length > 0) {
    reply =
      "The following users were successfully removed from the report list:\n\n";
    for (let eachDeletedUser of deletedUsers) {
      reply += `Username: ${eachDeletedUser.username}\n`;
    }
  } else {
    reply =
      "None of the users you entered were found in the report list, here is a list of the users currently in the list:\n\n";
    for (let eachUser of db.report) {
      reply += `Username: ${eachUser.username}\n`;
    }
  }
  return reply;
}
/*
 * updates the report list in the database
 * @param {{username: string, id: number}} data
 */
function updateDbReport(data) {
  let db = readDb();
  for (let eachUser of db.report) {
    if (eachUser.id === data.id) {
      return "User is already added to the report list";
    }
  }
  db.report.push({ username: data.username, id: data.id });
  writeDb(db);
  return "User added to report list";
}
function updateDbMonitored(data, typeOfUpdate) {
  /*
   * data: [{name: string, ip: number}]
   * typeOfUpdate: ADD || DELETE
   */
  let result = "";
  let db = readDb();
  if (typeOfUpdate === "ADD") {
    let addToDb = true;
    for (let eachEntry of db.monitored) {
      if (data.name === eachEntry.name && data.ip === eachEntry.ip) {
        // if there is already an entry in _DB_ with same name and ip
        addToDb = false;
        break;
      }
    }
    if (addToDb) {
      db.monitored.push(data);
      result += `Successfully added the following node data to list of monitored nodes.\n\nNode name: ${data.name}\nNode IP: ${data.ip}`;

      // write to DB
      writeDb(db);
    } else {
      result += `There is already an entry in the list of monitored nodes with the following data:\n\nNode name: ${data.name}\nNode IP: ${data.ip}`;
    }
  } else if (typeOfUpdate === "DELETE") {
    let newMonitoredInDb = [];
    let entryWasRemoved = false;
    for (let eachEntry of db.monitored) {
      if (data.name === eachEntry.name || data.ip === eachEntry.ip) {
        // do nothing
        entryWasRemoved = true;
      } else {
        newMonitoredInDb.push({ ...eachEntry });
      }
    }
    db.monitored = newMonitoredInDb;

    // write to DB
    writeDb(db);
    if (entryWasRemoved) {
      result += `Node was successfully removed from list of monitored, send /showListOfMonitored command to check updated list of monitored nodes`;
    } else {
      result +=
        "The node you specified was not found in the list of monitored nodes";
    }
  } else {
    console.log(
      'typeOfUpdate can only be "ADD" or "DELETE", raised exception because value of typeOfUpdate was ',
      typeOfUpdate
    );
    throw "Wrong typeOfUpdate";
  }

  return result;
}

module.exports = {
  readDb: readDb,
  writeDb: writeDb,
  updateDbMonitored: updateDbMonitored,
  addBotAdmin: addBotAdmin,
  updateDbReport: updateDbReport,
  getListOfPreps: getListOfPreps,
  updatePrepsList: updatePrepsList,
  getStrings: getStrings,
  prepsFileExists: prepsFileExists,
  monitoredNodesExists: monitoredNodesExists,
  removeUsersFromDbReport: removeUsersFromDbReport
};
