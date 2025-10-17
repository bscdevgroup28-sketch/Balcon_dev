import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SequenceAttributes {
  name: string;
  nextValue: number;
  updatedAt?: Date;
  createdAt?: Date;
}

interface SequenceCreation extends Optional<SequenceAttributes, 'nextValue'> {}

export class Sequence extends Model<SequenceAttributes, SequenceCreation> implements SequenceAttributes {
  public name!: string;
  public nextValue!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Sequence.init({
  name: { type: DataTypes.STRING(100), primaryKey: true },
  nextValue: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 1 }
}, { sequelize, tableName: 'sequences' });

export async function getNextSequence(name: string, tx?: any): Promise<number> {
  const transaction = tx || await sequelize.transaction();
  try {
    let row = await Sequence.findByPk(name, { transaction, lock: tx ? undefined : transaction.LOCK.UPDATE });
    if (!row) {
      row = await Sequence.create({ name, nextValue: 2 }, { transaction });
      if (!tx) await transaction.commit();
      return 1;
    }
    const current = row.nextValue;
    row.nextValue = current + 1;
    await row.save({ transaction });
    if (!tx) await transaction.commit();
    return current;
  } catch (e) {
    if (!tx) await transaction.rollback();
    throw e;
  }
}
