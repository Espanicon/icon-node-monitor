// services/logger.js
const path = require("path");
const fs = require("fs");
const util = require("util");

const LOG_PATH = "logs/";
const LINE_BREAK = "###\n";
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

function initializeLogFile() {
  //
  return LINE_BREAK + "New Log file\n" + getLogHeader();
}

function getLogHeader() {
  //
  const time = new Date();
  return LINE_BREAK + `Time: ${time.toISOString()}` + "\n---\n";
}

function readLogFile() {
  //
  const LOG_FILE_NAME = `LOG-${new Date().toISOString().split("T")[0]}`;
  if (fs.existsSync(customPath(LOG_PATH + LOG_FILE_NAME))) {
    return fs.readFileSync(customPath(LOG_PATH + LOG_FILE_NAME), "utf8");
  } else {
    const logFile = initializeLogFile();
    fs.writeFileSync(customPath(LOG_PATH + LOG_FILE_NAME), logFile);
    return logFile;
  }
}
function updateLogFile(data) {
  //
  const LOG_FILE_NAME = `LOG-${new Date().toISOString().split("T")[0]}`;
  const timeframe = 60 * 60 * 1000;
  let logFile = readLogFile();
  const lastTime = logFile
    .match(/\bTime:\s.*\b/g)
    .slice(-1)[0]
    .split(" ")
    .slice(-1)[0];

  let lastLogDate = new Date(lastTime);
  let now = new Date();
  let newLogContent;

  if (lastLogDate.getTime() + timeframe > now.getTime()) {
    newLogContent = logFile + data + "\n";
  } else {
    newLogContent = logFile + getLogHeader() + data + "\n" + LINE_BREAK;
  }

  fs.writeFileSync(customPath(LOG_PATH + LOG_FILE_NAME), newLogContent);
}

function useLog(...args) {
  //
  const arrayOfMessages = [...args];
  for (let each of arrayOfMessages) {
    const formatted = util.format(each);

    // prints into the log file and also console.log
    updateLogFile(formatted);
    console.log(each);
  }
}

if (require.main === module) {
  // if the file gets called directly from the terminal
  console.log(readLogFile());
} else {
  // if the file gets imported as a module
  module.exports = useLog;
}
