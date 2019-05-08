module.exports = (sequelize, DataTypes) => {
    const Session = sequelize.define(
        'sessions',
        {
            sid: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            sess: DataTypes.JSON,
            expire: DataTypes.DATE,
        },
        {
            freezeTableName: true,
            tableName: 'session',
            timestamps: false,
        },
    );

    return Session;
};
