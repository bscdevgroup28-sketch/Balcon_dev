"use strict";
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite::memory:';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.LOG_LEVEL = 'error';
// Prevent process.exit from killing tests
const realExit = process.exit;
// @ts-ignore
process.exit = (code) => {
    throw new Error(`process.exit called with code ${code}`);
};
// Silence console noise during tests
['log', 'info', 'warn', 'error'].forEach(m => {
    // @ts-ignore
    console[m] = (..._args) => { };
});
