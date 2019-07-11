import { DataTypes, Sequelize } from 'sequelize';
import { Session } from './session.model';

export const initSession = (sequelize: Sequelize) => {
    const attributes = {
        sid: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        sess: DataTypes.JSON,
        expire: DataTypes.DATE,
    };

    Session.init(attributes, {
        freezeTableName: true,
        modelName: 'session',
        sequelize,
        tableName: 'session',
        timestamps: false,
    });

    return Session;
};

export default initSession;
