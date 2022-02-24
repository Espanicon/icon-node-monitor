// test/api/getNodeGoloopVersion.test.js
const { getNodeGoloopVersion } = require("../../api/getNodeGoloopVersion.js");
const { model } = require("../../model");

async function test() {
  let db = model.readDb();

  if (db.monitored.length > 0) {
    for (let eachNode of db.monitored) {
      let req = await getNodeGoloopVersion(eachNode);
      console.log(req);
    }
  } else {
    console.log("No nodes have been added to the monitored list");
  }
}

test();
