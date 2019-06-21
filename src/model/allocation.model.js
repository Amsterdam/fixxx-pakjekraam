module.exports = (sequelize, DataTypes) => {
    const allocation = sequelize.define(
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
