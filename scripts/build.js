const { syncGetPreps } = require("../services");
//const fs = require('fs');

const PATH = "./data/preps.json";

syncGetPreps(PATH);
