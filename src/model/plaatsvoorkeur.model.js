module.exports = (sequelize, DataTypes) => {
    const plaatsVoorkeur = sequelize.define(
        'plaatsvoorkeur',
        {
            marktId: {
                type: DataTypes.INTEGER,
                unique: 'key',
            },
            erkenningsNummer: {
                type: DataTypes.STRING,
                unique: 'key',
            },
            plaatsId: {
                type: DataTypes.STRING,
                unique: 'key',
            },
            priority: {
                type: DataTypes.INTEGER,
            },
        },
        {
            freezeTableName: true,
            tableName: 'plaatsvoorkeur',
        },
    );

    return plaatsVoorkeur;
};
