module.exports = (sequelize, DataTypes) => {
    const plaatsVoorkeur = sequelize.define(
        'voorkeur',
        {
            erkenningsNummer: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: 'key',
            },
            marktId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                unique: 'key',
            },
            marktDate: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                unique: 'key',
            },
            monday: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            tuesday: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            wednesday: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            thursday: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            friday: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            saturday: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            sunday: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            anywhere: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            aantalPlaatsen: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            brancheId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            parentBrancheId: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            inrichting: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            inactive: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
        },
        {
            freezeTableName: true,
            tableName: 'voorkeur',
        },
    );

    return plaatsVoorkeur;
};
