// model/model.js
const fs = require("fs");
const customPath = require("../services/customPath.js");
const syncGetPreps = require("../services/syncGetPreps.js");
const networkProposals = require("../api/networkProposals.js");
const lib = require("../services/lib.js");
const useLog = require("../services/logger.js");

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
    state: { locked: false },
    versionCheck: true,
    lastBlockHeightCheckedForProposals: null
  };
}
function getStrings() {
  let strings = null;
  try {
    strings = JSON.parse(fs.readFileSync(customPath(_STRINGS_)));
    return strings;
  } catch (err) {
    useLog("Error while processing 'data/strings.json' file", err);
    // this file is critical so if it doesnt exists throw an exception to kill app
    throw "CRITICAL ERROR: there was an error while processing strings.json file";
  }
}

function updatePrepsList() {
  // rebuilds the preps.json file
  useLog("running updatePrepsList()");
  return syncGetPreps(customPath(_PREPS_));
}

function getListOfPreps() {
  useLog("running getListOfPreps()");
  let result = null;
  if (prepsFileExists() === true) {
    try {
      result = JSON.parse(fs.readFileSync(customPath(_PREPS_)));
    } catch (err) {
      useLog("Error while reading data/preps.json", err);
      // useLog("Creating new list of preps");
      // updatePrepsList();
      // preps = JSON.parse(fs.readFileSync(customPath(_PREPS_)));
    }
  } else {
    result = updatePrepsList();
  }
  useLog(`Result of running getListOfPreps: ${result}`);
  return result;
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
    useLog(`Successfully added user ${db.admin.username} as bot admin`);
  } else {
    useLog(
      `Current user was not added as admin because the bot admin state is currently locked and admin was already added. Current bot admin is ${db.admin.username}`
    );
  }
}

function readDbAndCheckForAdmin(currentUser) {
  useLog(
    `Running  readDbAndCheckForAdmin(currentUser) with currentUser = ${currentUser}`
  );
  db = readDb();
  if (db.admin.id == null || db.admin.username == null) {
    // if bot admin havent been set
    useLog("Bot admin have not been set");
    addBotAdmin(currentUser);
  }
  // return new read on db to account for an update on admin status
  return readDb();
}

function readDb() {
  useLog(`reading local db on ${customPath(_DB_)}`);
  if (fs.existsSync(customPath(_DB_))) {
    const db = JSON.parse(fs.readFileSync(customPath(_DB_)));
    useLog(db);
    return db;
  } else {
    let firstState = dbInitState();
    fs.writeFileSync(customPath(_DB_), JSON.stringify(firstState));
    useLog(firstState);
    return firstState;
  }
}

function writeDb(data) {
  useLog(`Writing new data to local db in ${customPath(_DB_)}`);
  useLog(data);
  fs.writeFileSync(customPath(_DB_), JSON.stringify(data));
}

/*
 * Remove one or more users from the report list in the database
 * @param {string} validatedStringOfUsers
 */
function removeUsersFromDbReport(validStringOfUsers) {
  let parsedListOfUsers = lib.parseUserList(validStringOfUsers);
  useLog(
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
  useLog(
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
  useLog(`Running updateDbReport`);
  useLog(data);
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
  useLog("Running updateDbMonitored");
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
    useLog(
      'typeOfUpdate can only be "ADD" or "DELETE", raised exception because value of typeOfUpdate was ',
      typeOfUpdate
    );
    throw "Wrong typeOfUpdate";
  }

  useLog("Result of running updateDbMonitored");
  useLog(result);
  return result;
}

function lock() {
  useLog("Locking database");
  let db = readDb();
  db.state.locked = true;
  writeDb(db);
  useLog("database locked");
}
function unlock() {
  useLog("unlocking database");
  let db = readDb();
  db.state.locked = false;
  writeDb(db);
  useLog("database unlocked");
}

function versionCheckStatus(statusString) {
  // statusString can either be 'start' or 'stop'
  useLog("Running versionCheckStatus");
  let db = readDb();
  if (statusString === "stop") {
    db.versionCheck = false;
  } else if (statusString === "start") {
    db.versionCheck = true;
  } else {
    // statusString can only be 'start' or 'stop' this condition should
    // not happen
  }
  writeDb(db);
}

///////////////////////NETWORK PROPOSALS METHODS
async function getLastBlock() {
  useLog("Running getLastBlock");
  return await networkProposals.getLastBlock();
}
async function getPreps(height = null) {
  useLog("Running getPreps");
  return await networkProposals.getPreps(height);
}

function parseProposals(arrayOfProposals) {
  useLog("Running parseProposals");
  let parsedProposals = [];
  for (let proposal of arrayOfProposals) {
    let proposalObject = {
      ...proposal,
      end_block_height: parseInt(proposal.endBlockHeight, 16),
      start_block_height: parseInt(proposal.startBlockHeight, 16),
      proposer_name: proposal.proposerName,
      title:
        proposal.contents.title == null ? "undefined" : proposal.contents.title,
      type:
        proposal.contents.type == null ? "undefined" : proposal.contents.type,
      contents_json: {
        ...proposal.contents
      }
    };

    parsedProposals.push(proposalObject);
  }

  return parsedProposals;
}

async function getProposalSummaryByStartBlockHeight(
  startBlockHeight,
  fromTracker = false
) {
  useLog("Running getProposalSummaryByStartBlockHeight");
  let proposals;
  if (fromTracker) {
    proposals = await networkProposals.getProposalsFromTracker();
  } else {
    let rawProposals = await networkProposals.getProposals();
    proposals = parseProposals(rawProposals);
  }
  let proposalFromBlockHeight = null;
  let summaryResponse = {};

  for (let proposal of proposals) {
    if (proposal.start_block_height === startBlockHeight) {
      proposalFromBlockHeight = proposal;
    }
  }

  // early null return if no id matches any proposal
  if (proposalFromBlockHeight === null) return null;

  // get all preps at given block height
  const prepsAtHeight = await networkProposals.getPreps(
    proposalFromBlockHeight.start_block_height
  );
  // const prepsAtHeight = await networkProposals.getPreps(146841895);
  const prepsSummary = prepsAtHeight
    .filter(prep => {
      if (prep.grade !== "0x0") {
        return false;
      }
      return true;
    })
    .map(prep => ({
      name: prep.name,
      address: prep.address
    }));

  return { prepsToVote: prepsSummary, ...proposalFromBlockHeight };
}

async function checkForNewProposals(
  lastProposalBlockHeight,
  fromTracker = false
) {
  useLog("Running checkForNewProposals");
  let proposals;
  if (fromTracker) {
    proposals = await networkProposals.getProposalsFromTracker();
  } else {
    let rawProposals = await networkProposals.getProposals();
    proposals = parseProposals(rawProposals);
  }
  let newProposals = [];

  for (let index = 0; index < proposals.length; index++) {
    if (proposals[index].start_block_height >= lastProposalBlockHeight) {
      newProposals.push(proposals[index]);
    }
  }

  if (newProposals.length === 0) {
    return null;
  } else {
    return newProposals;
  }
}

async function getNewProposalsSummary(lastProposalBlockHeight) {
  useLog("Running getNewProposalsSummary");
  let newProposals = await checkForNewProposals(lastProposalBlockHeight);
  let newProposalsSummary = [];

  if (newProposals === null) return null;

  for (let proposal of newProposals) {
    const proposalSummary = await getProposalSummaryByStartBlockHeight(
      proposal.start_block_height
    );
    newProposalsSummary.push(proposalSummary);
  }

  return newProposalsSummary;
}

async function parseNewProposalsSummary(arrayOfProposals) {
  useLog("Running parseNewProposalsSummary");
  if (arrayOfProposals === null) {
    return "No new proposals.";
  } else {
    const lastBlock = await networkProposals.getLastBlock();
    let response =
      "New Proposals Summary:\n" +
      `Current block height: ${lastBlock}` +
      "\n\n";

    let breakLine = "---------------------\n";
    response += breakLine;

    for (let proposal of arrayOfProposals) {
      response +=
        `Proposal title: ${proposal.title}` +
        "\n" +
        `Proposer name: ${proposal.proposer_name}` +
        "\n\n" +
        `Proposal begin (block height): ${proposal.start_block_height}` +
        "\n\n" +
        `Proposal ends (block height): ${proposal.end_block_height}` +
        "\n\n" +
        "Preps to vote:\n";

      for (let prep of proposal.prepsToVote) {
        response +=
          `Prep name: ${prep.name}` +
          "\n" +
          `Prep address: ${prep.address}` +
          "\n";
      }

      response += "\n" + breakLine;
    }

    return response;
  }
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
  removeUsersFromDbReport: removeUsersFromDbReport,
  readDbAndCheckForAdmin: readDbAndCheckForAdmin,
  lock: lock,
  unlock: unlock,
  versionCheckStatus: versionCheckStatus,
  getLastBlock: getLastBlock,
  getPreps: getPreps,
  getProposals: networkProposals.getProposals,
  getProposalSummaryByStartBlockHeight: getProposalSummaryByStartBlockHeight,
  checkForNewProposals: checkForNewProposals,
  getNewProposalsSummary: getNewProposalsSummary,
  parseNewProposalsSummary: parseNewProposalsSummary
};
