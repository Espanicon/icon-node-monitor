// ./getPreps.test.js

const getPreps = require("../../services/syncGetPreps.js");
const fs = require('fs');

// Global constants
//
const NODES = [
  "ctz.solidwallet.io",
  "api.icon.geometry.io",
  "52.196.159.184",
  "35.170.9.187",
  "104.21.5.198"
];
const PARAMS = {
  hostname: NODES[1],
  path: "/admin/chain/0x1"
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

console.log("running getPreps.js test");
(async () => {
  await getPreps(FILE_PATH);
  try {
    if (fs.existsSync(FILE_PATH)) {
      let data = fs.readFileSync(FILE_PATH, 'utf8');
      console.log(data);
      fs.unlinkSync(FILE_PATH);
    }
  } catch (err) {
    console.log(err);
  }
  console.log("test end");
})();


