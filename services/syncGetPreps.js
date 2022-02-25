// This sample code gets the IP addresses, node name and wallet addresses
// of the block producers in the ICON network.
// It connects with a node to directly get the IP address and the queries
// the ICON blockchain to get the node names and wallet addresses.
//

// Imports
//
require("dotenv").config();
const { httpRequest, httpsRequest } = require("../api");
const fs = require("fs");
const customPath = require("../services/customPath.js");

// TODO: currently the model/model.js module is importing this file, to avoid
// to avoid circular dependency issues the exact same code logic for reading
// the db.json database that exists in the model.js module is being implemented
// here. Possible solution, move that logic into another file and import that
// on both model.js and this file
const _DB_ = "data/db.json";
function readDb() {
  if (fs.existsSync(customPath(_DB_))) {
    return JSON.parse(fs.readFileSync(customPath(_DB_)));
  } else {
    console.log("database (db.json) havent been created");
    return null;
  }
}

// Global constants
//
const NODES = ["ctz.solidwallet.io", "api.icon.geometry.io"];
const PARAMS = {
  path: "/admin/chain/0x1",
  port: 9000
};
const PARAMS2 = {
  hostname: NODES[1],
  path: "/api/v3",
  method: "POST",
  headers: {
    "content-type": "text/plain",
    charset: "UTF-8"
  }
};
const DATA = JSON.stringify({
  jsonrpc: "2.0",
  method: "icx_call",
  id: 1,
  params: {
    to: "cx0000000000000000000000000000000000000000",
    dataType: "call",
    data: {
      method: "getPReps",
      params: {
        startRanking: "0x1",
        endRanking: "0x1E"
      }
    }
  }
});
const FILE_PATH = "./dataTest.json";

async function asyncRun(path = FILE_PATH) {
  // run the entire program inside an async function to be able to use await
  // and wait for the servers to reply to the different queries
  //
  let db = readDb();
  if (db == null) {
    return false;
  } else {
    if (db.monitored.length > 0) {
      // if no node has been added to the list of monitored nodes then we cannot
      // update the Prep list and this process is skipped.
      // if at least one node has been added to the list of monitored but the
      // node is unreachable this process will fail
      try {
        let params1 = { hostname: db.monitored[0].ip, ...PARAMS };
        let resultQuery1 = await httpRequest(params1);
        let resultQuery2 = await httpsRequest(PARAMS2, DATA);
        let roots = resultQuery1.module.network.p2p.roots;
        let preps = resultQuery2.result.preps;
        let parsedPReps = [];

        preps.forEach(prep => {
          for (eachIp in roots) {
            if (
              roots[eachIp] === prep.address ||
              roots[eachIp] === prep.nodeAddress
            ) {
              parsedPReps.push({
                name: prep.name,
                address: roots[eachIp],
                ip: eachIp.split(":")[0]
              });
            }
          }
        });

        if (fs.existsSync(path)) {
          console.log(
            `file '${path}' already exists, it will be removed to update it.`
          );
          fs.unlinkSync(path);
        }
        let fileData = JSON.stringify({ NODES_ARRAY: parsedPReps });
        fs.writeFileSync(path, fileData);
        console.log(`file '${path}' created`);
        console.log(parsedPReps);
        // if the process was finished corretly we return true, the function calling
        // this method will receive this and validate that the update on the Preps
        // list was done correctly
        return true;
      } catch (err) {
        console.log("Unexpected error while trying to create preps.json file");
        console.error(err);
      }
    } else {
      return false;
    }
  }
}

if (require.main === module) {
  // If its the main entry point of the app
  //
  console.log("running syncGetPReps() standalone");
  asyncRun();
} else {
  // If its a module
  //
  console.info("syncGetPreps.js imported as a module");
  module.exports = asyncRun;
}
