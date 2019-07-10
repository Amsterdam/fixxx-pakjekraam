import { Sequelize, DataTypes, Model, BuildOptions } from 'sequelize';
import { Allocation } from './allocation.model';

type AllocationStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): Allocation;
};

const init = (sequelize: Sequelize) => {
    const allocation = <AllocationStatic>sequelize.define(
        'allocation',
        {
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
        },
        {
            freezeTableName: true,
            tableName: 'allocation',
        },
    );

    return allocation;
};

export default init;
