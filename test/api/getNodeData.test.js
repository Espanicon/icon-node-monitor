const { getDataFromArrayOfNodes } = require("../../api/getNodeData.js");

// global constants for testing and running standalone
const PARAMS = {
  port: 9000,
  path: "/admin/chain/0x1",
  timeout: 4000
};
const NODES = [
  { name: "offline", ip: "35.170.9.187" },
  { name: "Espanicon", ip: "65.108.47.72" }
];

console.log('running test on "api/getNodeData"');
(async () => {
  let res = await getDataFromArrayOfNodes(NODES, PARAMS);
  console.log(res);
})();
