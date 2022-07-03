// api/getNodeGoloopVersion.js
const httpRequest = require("./httpRequest.js");
const useLog = require("../services/logger.js");

const PARAMS = {
  port: 9000,
  path: "/admin/system",
  timeout: 4000
};

async function getNodeGoloopVersion(node, params = PARAMS) {
  let result = {
    version: null,
    name: node.name,
    ip: node.ip
  };

  try {
    const req = await httpRequest({
      hostname: node.ip,
      ...params
    });

    result.version = req.buildVersion;
  } catch (err) {
    useLog("Error on getNodeGoloopVersion: " + err);
  }
  return result;
}

module.exports = getNodeGoloopVersion;
