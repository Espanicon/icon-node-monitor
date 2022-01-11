// ./bot/botReplyMaker.js
//

function checkMonitoredNodesHeight() {}
function checkBlockProducersHeight() {}
function checkMonitoredAndBlockProducersHeight() {}

/**
 * Creates bot reply for commands checking node height and block gap
 * param {{highestBlock: number, nodes [{gap: number, name: string, height:number}]}} data
 */
function makeNodesHeightAndGapReply(data) {
  let reply = `ICON Blockchain current block: ${data.highestBlock}\n\n`;

  for (let node of data.nodes) {
    reply =
      reply +
      `Node name: ${node.name}\nHeight: ${node.height}\nBlock gap:${node.gap}\n\n`;
  }
  return reply;
}

function makeUpdateListOfPrepsReply(data) {
  const lineBreaker = "-------------";
  let reply = "List of Preps in descending order of rank in the network:\n\n";
  for (let node of data.NODES_ARRAY) {
    reply +=
      `Node name: ${node.name}\nNode address: ${node.address}\nNode IP: ${node.ip}\n` +
      lineBreaker +
      "\n";
  }
  return reply;
}

module.exports.makeNodesHeightAndGapReply = makeNodesHeightAndGapReply;
module.exports.makeUpdateListOfPrepsReply = makeUpdateListOfPrepsReply;
