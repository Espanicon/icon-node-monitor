const httpsRequest = require("../api/httpsRequest.js");

const GLOBAL = {
  node: {
    ctz: "ctz.solidwallet.io",
    geometry: "api.icon.geometry.io",
    tracker: "tracker.icon.community"
  },
  routes: {
    v3: "/api/v3",
    proposals: "/api/v1/governance/proposals"
  },
  param: {
    headers: {
      "content-type": "text/plain",
      charset: "UTF-8"
    }
  }
};
async function getLastBlock() {
  let response;
  try {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      method: "icx_getLastBlock",
      id: Math.ceil(Math.random() * 1000)
    });

    const params = {
      hostname: GLOBAL.node.ctz,
      path: GLOBAL.routes.v3,
      method: "POST",
      ...GLOBAL.param
    };

    response = await httpsRequest(params, postData);
    return response.result.height;
  } catch (err) {
    console.log("error running customHttpsRequest");
    console.log(err);
    console.log(response);
    return null;
  }
}
async function customHttpsRequest(
  route,
  data = false,
  hostname = GLOBAL.node.ctz
) {
  let response;
  try {
    let params = {
      hostname: hostname,
      path: route,
      method: data ? "POST" : "GET",
      ...GLOBAL.param
    };

    response = await httpsRequest(params, data);
    return response;
  } catch (err) {
    console.log("error running customHttpsRequest");
    console.log(err);
    console.log(response);
    return null;
  }
}

function makePostData(method, params, height = null) {
  let data = {
    jsonrpc: "2.0",
    method: "icx_call",
    id: Math.ceil(Math.random() * 1000),
    params: {
      to: "cx0000000000000000000000000000000000000000",
      dataType: "call",
      data: {
        method: method,
        params: params
      }
    }
  };

  if (height === null) {
  } else {
    if (typeof height !== "number") {
      throw new Error("height type must be number");
    } else {
      data.params.height = "0x" + height.toString(16);
    }
  }
  return JSON.stringify(data);
}

module.exports = {
  customHttpsRequest: customHttpsRequest,
  makePostData: makePostData,
  GLOBAL: GLOBAL,
  getLastBlock: getLastBlock
};
