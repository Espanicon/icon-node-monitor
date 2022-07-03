const httpsRequest = require("../api/httpsRequest.js");
const useLog = require("../services/logger.js");

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

async function customHttpsRequest(
  route,
  data = false,
  hostname = GLOBAL.node.ctz
) {
  try {
    let params = {
      hostname: hostname,
      path: route,
      method: data ? "POST" : "GET",
      ...GLOBAL.param
    };

    const request = await httpsRequest(params, data);
    // return JSON.parse(request);
    return request;
  } catch (err) {
    useLog("error running customHttpsRequest");
    useLog(err);
    return null;
  }
}

function makeJSONRPCRequestObject(method) {
  //
  return {
    jsonrpc: "2.0",
    method: method,
    id: Math.ceil(Math.random() * 1000)
  };
}
async function getProposals() {
  const JSONRPCObject = makeICXCallRequestObject(
    "getProposals",
    null,
    null,
    "cx0000000000000000000000000000000000000001"
  );

  const request = await customHttpsRequest(GLOBAL.routes.v3, JSONRPCObject);
  return request.result.proposals;

  // try {
  //   const parsedRequest = JSON.parse(request);
  //   return parsedRequest.result.proposals
  // } catch (err) {
  //   useLog("error on getPreps request response");
  //   useLog(`response: ${request}.`);
  //   console.error(err);
  //   return [];
  // }
}

function makeICXCallRequestObject(
  method,
  params = null,
  height = null,
  to = "cx0000000000000000000000000000000000000000"
) {
  const JSONRPCRequestObject = makeJSONRPCRequestObject("icx_call");
  let data = {
    ...JSONRPCRequestObject,
    params: {
      to: to,
      dataType: "call",
      data: {
        method: method
      }
    }
  };

  if (params === null) {
  } else {
    data.params.data.params = params;
  }

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

async function getScoreApi(
  address = "cx0000000000000000000000000000000000000000"
) {
  //
  try {
    const postData = JSON.stringify({
      ...makeJSONRPCRequestObject("icx_getScoreApi"),
      params: {
        address: address
      }
    });

    const response = await customHttpsRequest(GLOBAL.routes.v3, postData);
    // const parsedResponse = JSON.parse(response);
    return response.result;
  } catch (err) {
    useLog("error running customHttpsRequest");
    useLog(err);
    return null;
  }
}
async function getLastBlock() {
  try {
    const postData = JSON.stringify(
      makeJSONRPCRequestObject("icx_getLastBlock")
    );

    const response = await customHttpsRequest(GLOBAL.routes.v3, postData);
    // useLog(response);
    // const parsedResponse = JSON.parse(response);
    return response.result.height;
  } catch (err) {
    useLog("error running customHttpsRequest");
    useLog(err);
    return null;
  }
}

async function getPreps(height = null) {
  const postData = makeICXCallRequestObject(
    "getPReps",
    { startRanking: "0x1" },
    height
  );
  const request = await customHttpsRequest(GLOBAL.routes.v3, postData);
  return request.result.preps;

  // try {
  //   const parsedRequest = JSON.parse(request);
  //   return parsedRequest.result.preps;
  // } catch (err) {
  //   useLog("error on getPreps request response");
  //   useLog(`response: ${request}.`);
  //   console.error(err);
  //   return [];
  // }
}

async function getProposalsFromTracker() {
  const request = await customHttpsRequest(
    GLOBAL.routes.proposals,
    false,
    GLOBAL.node.tracker
  );
  return request;
}

module.exports = {
  customHttpsRequest: customHttpsRequest,
  makeJSONRPCRequestObject: makeJSONRPCRequestObject,
  GLOBAL: GLOBAL,
  getLastBlock: getLastBlock,
  makeICXCallRequestObject: makeICXCallRequestObject,
  getScoreApi: getScoreApi,
  getPreps: getPreps,
  getProposalsFromTracker: getProposalsFromTracker,
  getProposals: getProposals
};
