// Jest manual mock for axios to avoid ESM import issues in CRA/Jest
const axios = require('axios/dist/node/axios.cjs');
module.exports = axios;
