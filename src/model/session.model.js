const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Session extends Model {}

    Session.init(
        {
            sid: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            sess: DataTypes.JSON,
            expire: DataTypes.DATE,
        },
        { sequelize, modelName: 'session', freezeTableName: true, tableName: 'session', timestamps: false },
    );

    return Session;
};
