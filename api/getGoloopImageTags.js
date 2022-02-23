const httpsRequest = require("./httpsRequest.js");
const path = require("path");

const URL = {
  hostname: "index.docker.io",
  path: ["/v2/iconloop/goloop-icon/tags/list", "/v2/library/alpine/tags/list"]
};

const URL2 = {
  hostname: "auth.docker.io",
  path: [
    "/token?service=registry.docker.io&scope=repository:iconloop/goloop-icon:pull"
  ]
};

const PARAMS = {
  hostname: URL.hostname,
  path: URL.path[0]
};

const PARAMS2 = {
  hostname: URL2.hostname,
  path: URL2.path[0]
};
function getParams(token) {
  return {
    hostname: URL.hostname,
    path: URL.path[0],
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}
async function getGoloopImageTags() {
  try {
    const tokenReq = await httpsRequest(PARAMS2);
    // console.log(tokenReq);

    let authParams = getParams(tokenReq.token);
    // console.log(authParams);

    const req = await httpsRequest(authParams);
    // const req = await httpsRequest(PARAMS);
    return req;
  } catch (err) {
    console.log("error running query");
    console.log(err);
  }
}
const filePathInfo = path.parse(__filename);
if (require.main === module) {
  // if the file gets called directly on the terminal
  console.log(`running ${filePathInfo.base} file directly from the terminal`);
  (async () => {
    let result = await getGoloopImageTags();
    console.log(result);
  })();
} else {
  // if the file gets imported as a module
  console.log(`${filePathInfo.base} file imported as a module`);
  module.exports = getGoloopImageTags;
}
