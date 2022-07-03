const useLog = require('../../services/logger.js');

const foo = `test message for logger`;
const bar = 'another test message for logger';

useLog(foo)
useLog(bar);
