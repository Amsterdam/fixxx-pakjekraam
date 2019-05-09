module.exports = (sequelize, DataTypes) => {
    const RSVP = sequelize.define(
        'rsvp',
        {
            marktId: DataTypes.INTEGER,
            marktDate: DataTypes.DATEONLY,
            erkenningsNummer: DataTypes.STRING,
            attending: DataTypes.BOOLEAN,
        },
        {
            freezeTableName: true,
            tableName: 'rsvp',
        },
    );

    return RSVP;
};
