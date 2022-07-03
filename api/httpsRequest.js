// This sample code gets the IP addresses, node name and wallet addresses
// of the block producers in the ICON network.
// It connects with a node to directly get the IP address and the queries
// the ICON blockchain to get the node names and wallet addresses.
//

// Imports
//
const https = require("https");
const useLog = require("../services/logger.js");

/**
 * async https request wrapped in a promise
 * @param {Object} param - params for the http request
 * @param {string} param.hostname
 * @param {string} param.ip
 * @param {number} param.port
 * @param {number} param.timeout
 * @param {string} param.path
 */
async function httpsRequest(params, data = false) {
  const promisifiedQuery = new Promise((resolve, reject) => {
    useLog("query ip: " + params.hostname);
    const query = https.request(params, res => {
      // Print status code on console
      useLog("Status Code: " + res.statusCode);

      // Process chunked data
      let rawData = "";
      res.on("data", chunk => {
        rawData += chunk;
      });

      // when request completed, pass the data to the 'resolve' callback
      res.on("end", () => {
        let data = JSON.parse(rawData);
        resolve(data);
      });

      // if error, print on console
      res.on("error", err => {
        useLog("Got error: ", +err.message);
      });
    });
    // If request timeout destroy request
    query.on("timeout", () => {
      useLog("timeout. destroying query");
      query.destroy();
    });
    // Handle query error
    query.on("error", err => {
      useLog("error running query, passing error to callback reject");
      reject(err);
    });
    if (data != false) {
      // If data param is passed into function then we assume the call is
      // for path '/api/v3' and method is 'POST' so we send a .write to
      // the server.
      //
      query.write(data);
    }
    // end request
    query.end();
  });
  // wait for the response and return it
  try {
    return await promisifiedQuery;
  } catch (err) {
    useLog("error while running promisifiedQuery");
    useLog(err);
    throw "error connecting to node";
  }
}
module.exports = httpsRequest;
