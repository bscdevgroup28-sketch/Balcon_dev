"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sequence = void 0;
exports.getNextSequence = getNextSequence;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Sequence extends sequelize_1.Model {
}
exports.Sequence = Sequence;
Sequence.init({
    name: { type: sequelize_1.DataTypes.STRING(100), primaryKey: true },
    nextValue: { type: sequelize_1.DataTypes.BIGINT, allowNull: false, defaultValue: 1 }
}, { sequelize: database_1.sequelize, tableName: 'sequences' });
async function getNextSequence(name, tx) {
    const transaction = tx || await database_1.sequelize.transaction();
    try {
        let row = await Sequence.findByPk(name, { transaction, lock: tx ? undefined : transaction.LOCK.UPDATE });
        if (!row) {
            row = await Sequence.create({ name, nextValue: 2 }, { transaction });
            if (!tx)
                await transaction.commit();
            return 1;
        }
        const current = row.nextValue;
        row.nextValue = current + 1;
        await row.save({ transaction });
        if (!tx)
            await transaction.commit();
        return current;
    }
    catch (e) {
        if (!tx)
            await transaction.rollback();
        throw e;
    }
}
