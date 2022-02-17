// services/lib.js
function validateIp(ip) {
  let regex = new RegExp("^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(.|$)){4}$");
  return regex.test(ip);
}

/*
 * validates if the input is a string or usernames separated by spaces
 * @param {string} stringOfUsers
 */
function validateUserList(stringOfUsers) {
  let regex = new RegExp("^[a-zA-Z0-9_]{5,}$");
  let parsedArrayOfUsers = parseUserList(stringOfUsers);
  for (let eachUsername of parsedArrayOfUsers) {
    let resultOfTest = regex.test(eachUsername);
    if (resultOfTest === false) {
      return false;
    }
  }
  return true;
}

function parseUserList(stringOfUsers) {
  let arrayOfUsers = stringOfUsers.split(" ");
  let parsedArray = [];
  for (let eachUsername of arrayOfUsers) {
    if (eachUsername[0] === "@") {
      parsedArray.push(eachUsername.substring(1));
    } else {
      parsedArray.push(eachUsername);
    }
  }
  return parsedArray;
}

module.exports = {
  validateIp: validateIp,
  validateUserList: validateUserList,
  parseUserList: parseUserList
};
