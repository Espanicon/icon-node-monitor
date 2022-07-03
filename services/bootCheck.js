// services/bootCheck.js
// makes various checks at before running the bot.
const fs = require("fs");
const path = require("path");
const util = require("util");
const useLog = require("./logger.js");

const fullPath = path.parse(__filename).dir;
const fullPathArray = fullPath.split("/");
const MAIN_FOLDER = fullPathArray[fullPathArray.length - 2];

function customPath(relativePath) {
  const parsedPath = path.parse(__filename);
  let fullPathSplit = parsedPath.dir.split("/");

  for (let value of fullPathSplit) {
    if (fullPathSplit[fullPathSplit.length - 1] === MAIN_FOLDER) {
      break;
    } else {
      fullPathSplit.pop();
    }
  }
  fullPathSplit.push(relativePath);

  return fullPathSplit.join("/");
}

function checkLogFolder() {
  // check if the log folder exists
  let message = "";
  const logFolderPath = "logs/";

  try {
    if (!fs.existsSync(logFolderPath)) {
      message += "Logs/ folder not found.\n";
      fs.mkdirSync(logFolderPath);
      message += "Created new Logs/ folder\n";
      useLog(message);
      return;
    }
  } catch (err) {
    throw new Error("Error trying to create log folder", err);
  }
}

function makeBootCheck() {
  try {
    checkLogFolder();
    return true;
  } catch (err) {
    console.log("Error running boot check");
    console.log(err);
    return false;
  }
}

let BOOT_CHECK;
if (require.main === module) {
  // if the file gets called directly from the terminal, run the boot check;
  console.log(`Running boot check`);
  BOOT_CHECK = makeBootCheck();
  console.log(`all test passed? = ${BOOT_CHECK}`);
} else {
  console.log(`Running boot check`);
  BOOT_CHECK = makeBootCheck();
  console.log(`all test passed? = ${BOOT_CHECK}`);
  const bootCheck = { makeBootCheck: makeBootCheck, result: BOOT_CHECK };
  module.exports = bootCheck;
}
