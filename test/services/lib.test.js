// test/services/lib.test.js
const { lib } = require("../../services");

const COLORS = {
  red: "\033[31m ",
  green: "\x1b[32m ",
  reset: "\x1b[0m "
};

const tests = {
  validateIp: [
    { value: "eacoeg", result: false },
    { value: "102.233.332.233", result: true },
    { value: "https://localhost", result: false },
    { value: "0.0.0.0", result: false },
    { value: "999.999.999.", result: false }
  ],
  validateUserList: [
    { value: "eacoeg", result: true },
    { value: "@eacoeg", result: true },
    { value: "eacoeg @eswo1 @sssre @11111 @11s_we", result: true },
    { value: "ea", result: false },
    { value: "@122", result: false },
    { value: "@122wse we-wsw wewewsw,w ", result: false },
    { value: "edsoqq wsedeods- @wsssoso", result: false },
    { value: "wesoqsq weoscedo,", result: false }
  ]
};

function runTestOnValidateUserList() {
  let result = "Result of tests run on validateUserList() function\n\n";

  for (let eachTest of tests.validateUserList) {
    let resultOfTestBool = lib.validateUserList(eachTest.value);
    let resultOfTestString =
      resultOfTestBool === eachTest.result
        ? `${COLORS.green}PASSED`
        : `${COLORS.red}FAILED`;
    result += `Value tested: ${eachTest.value} /Result of test: ${resultOfTestString}${COLORS.reset}\n`;
  }

  console.log(result);
}

runTestOnValidateUserList();
