// imports
const httpRequest = require("./httpRequest");
const useLog = require("../services/logger.js");

// global constants for testing and running standalone
const PARAMS = {
  port: 9000,
  path: "/admin/chain/0x1",
  timeout: 7000
};
const NODES = [
  { name: "offline", ip: "35.170.9.187" },
  { name: "Espanicon", ip: "65.108.47.72" }
];

/**
 * Gets data from a node (ip, state, name, height)
 * @param {Object} node
 * @param {string} node.ip
 * @param {string} node.name
 * @param {Object} [params=PARAMS]
 * @param {number} params.port
 * @param {number} params.timeout
 * @param {string} params.path
 */
async function getDataFromNode(node, params = PARAMS) {
  // Async function to query a node
  //
  let result = {
    state: "unreachable",
    height: 0,
    name: node.name,
    ip: node.ip
  };
  try {
    const nodeResponse = await httpRequest({
      hostname: node.ip,
      ...params
    });
    result.state = nodeResponse.state;
    result.height = nodeResponse.height;
  } catch (error) {
    useLog("error on getDataFromNode: " + error);
  }
  return result;
}

/**
 * Runs getDataFromNode() for each node in an array
 * @param {Object[]} nodes
 * @param {string} nodes[].ip
 * @param {string} nodes[].name
 * @param {Object} [params=PARAMS]
 * @param {number} params.port
 * @param {number} params.timeout
 * @param {string} params.path
 */
async function getDataFromArrayOfNodes(nodes, params = PARAMS) {
  //Async function to query each node in an array of nodes
  //
  let results = [];
  for (const node of nodes) {
    let nodeResult = await getDataFromNode(node, params);
    results.push(nodeResult);
  }
  return results;
}
if (require.main === module) {
  // If it gets executed directly for testing
  //
  useLog(`running getDataFromArrayOfNodes() standalone`);
  (async () => {
    let res = await getDataFromArrayOfNodes(NODES, PARAMS);
    useLog(res);
  })();
} else {
  // If it gets imported as a module
  //
  useLog(`queryArrayOfNodes.js imported as module`);
  exports.getDataFromArrayOfNodes = getDataFromArrayOfNodes;
  exports.getDataFromNode = getDataFromNode;
}
