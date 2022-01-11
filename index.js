const axios = require("axios");
const node = "http://35.170.9.187:9000/admin/chain/0x1";

axios.get(node).then(resp => {
  console.log(`Block height = ${resp.data.height}`);
  console.log( typeof resp.data );
});
