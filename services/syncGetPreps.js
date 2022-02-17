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

// Global constants
//
const NODES = [
  "ctz.solidwallet.io",
  "api.icon.geometry.io",
  process.env.NODE_IP
];
const PARAMS = {
  hostname: NODES[2],
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
  let resultQuery1 = await httpRequest(PARAMS);
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
  try {
    if (fs.existsSync(path)) {
      console.log(`file '${path}' already exists`);
    } else {
      let fileData = JSON.stringify({ NODES_ARRAY: parsedPReps });
      fs.writeFileSync(path, fileData);
      console.log(`file '${path}' created`);
    }
  } catch (err) {
    console.error(err);
  }

  // Return array of objects representing each main PRep
  //
  console.log(parsedPReps);
  return parsedPReps;
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
