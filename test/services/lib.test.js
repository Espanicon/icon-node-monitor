// test/services/lib.test.js
const { lib } = require("../../services");
const utils = require("../utils.js");

const COLORS = utils.colors;

const TESTS = {
  validateIp: [
    { value: "eacoeg", result: false },
    { value: "102.233.332.233", result: false },
    { value: "https://localhost", result: false },
    { value: "0.0.0.0", result: true },
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
function testTemplate(title, tests, testCallback) {
  let result = title;

  for (let eachTest of tests) {
    let resultOfTestBool = testCallback(eachTest.value);
    let resultOfTestString =
      resultOfTestBool === eachTest.result
        ? `${COLORS.green}PASSED`
        : `${COLORS.red}FAILED`;
    result += `Value tested: ${eachTest.value} /Result of test: ${resultOfTestString}${COLORS.reset}\n`;
  }

  console.log(result);
}

function runTestOnValidateIp() {
  let title = "\nResult of tests run on validateIp() function\n\n";
  testTemplate(title, TESTS.validateIp, lib.validateIp);
}
function runTestOnValidateUserList() {
  let title = "\nResult of tests run on validateUserList() function\n\n";
  testTemplate(title, TESTS.validateUserList, lib.validateUserList);
}

runTestOnValidateUserList();
runTestOnValidateIp();
