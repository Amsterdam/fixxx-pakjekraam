import { Sequelize, DataTypes } from 'sequelize';
import { Allocation } from './allocation.model';

export const initAllocation = (sequelize: Sequelize) => {
    const attributes = {
        marktId: {
            type: DataTypes.INTEGER,
            unique: 'key',
        },
        marktDate: {
            type: DataTypes.DATEONLY,
            unique: 'key',
        },
        plaatsId: {
            type: DataTypes.STRING,
            unique: 'key',
        },
        erkenningsNummer: {
            type: DataTypes.STRING,
        },
    };

    Allocation.init(attributes, {
        modelName: 'allocation',
        freezeTableName: true,
        sequelize,
        tableName: 'allocation',
    });

    return Allocation;
};

export default initAllocation;
