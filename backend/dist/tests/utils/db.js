"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDb = resetDb;
const database_1 = require("../../src/config/database");
async function resetDb() {
    const models = database_1.sequelize.models;
    for (const name of Object.keys(models)) {
        await models[name].destroy({ where: {}, truncate: true, force: true });
    }
}
