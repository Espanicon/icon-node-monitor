// ./services/getChainAndNodesHeight.js
//

const { getNodeData } = require("../api");

/**
 * Returns chain height and height of each monitored nodes and block producers
 * @param {Array.<{name: String, ip: String}>} nodesArray
 * @param {Array.<{name: String, ip: String}>} monitorArray - Array of nodes to monitor.
 */
async function getChainAndNodesHeight(nodesArray, monitorArray = []) {
  let dataFromMonitored = [];
  if (monitorArray.length != 0) {
    dataFromMonitored = await getNodeData.getDataFromArrayOfNodes(monitorArray);
  }
  const dataFromNodes = await getNodeData.getDataFromArrayOfNodes(nodesArray);

  let result = {
    highestBlock: 0
  };

  let concatenatedArrays = [];
  for (let node of dataFromNodes.concat(dataFromMonitored)) {
    if (node.height > result.highestBlock) {
      result.highestBlock = node.height;
    }
    concatenatedArrays.push({
      name: node.name,
      height: node.height
    });
  }
  result.monitored = concatenatedArrays.splice(
    dataFromNodes.length,
    dataFromMonitored.length
  );
  result.nodes = concatenatedArrays.splice(
    dataFromMonitored.length,
    dataFromNodes.length
  );

  return result;
}

module.exports = getChainAndNodesHeight;
