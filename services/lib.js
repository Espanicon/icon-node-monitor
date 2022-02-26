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

function validateVersion(version) {
  //
  const regex = new RegExp(/^((v|V)\d*\.\d*\.\d*)/);
  if (regex.test(version) === true) {
    return version.match(regex)[0];
  } else {
    return null;
  }
}
function compareVersions(version1, version2) {
  //
  const regex = new RegExp(/^(v|V)/);
  let formattedV1 = regex.test(version1)
    ? version1.substring(1).split(".")
    : version1.split(".");
  let formattedV2 = regex.test(version2)
    ? version2.substring(1).split(".")
    : version2.split(".");

  let result = null;
  let shortestLength =
    formattedV1.length <= formattedV2.length
      ? formattedV1.length
      : formattedV2.length;

  for (let i = 0; i < shortestLength; i++) {
    if (parseInt(formattedV1[i]) === parseInt(formattedV2[i])) {
      // continue looping
      result = version1; // version1 is placed as default here
    } else {
      if (parseInt(formattedV1[i]) > parseInt(formattedV2[i])) {
        result = version1;
      } else {
        result = version2;
      }
      break;
    }
  }

  return result;
}
function getLatestVersion(listOfVersions) {
  let latestVersion = null;

  for (let eachVersion of listOfVersions) {
    let validatedVersion = validateVersion(eachVersion);

    if (validatedVersion == null) {
      // do nothing
    } else {
      if (latestVersion == null) {
        latestVersion = eachVersion;
      } else {
        latestVersion = compareVersions(latestVersion, validatedVersion);
      }
    }
  }
  return latestVersion;
}

module.exports = {
  validateIp: validateIp,
  validateUserList: validateUserList,
  parseUserList: parseUserList,
  getLatestVersion: getLatestVersion
};
