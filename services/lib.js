// services/lib.js
function validateIp(ip) {
  let regex = new RegExp("^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(.|$)){4}$");
  return regex.test(ip);
}

module.exports = {
  validateIp: validateIp
}
