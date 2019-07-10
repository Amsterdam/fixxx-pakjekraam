import { Sequelize, DataTypes, Model, BuildOptions } from 'sequelize';
import { RSVP } from './rsvp.model';

type RSVPStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): RSVP;
};

const init = (sequelize: Sequelize) => {
    const RSVP = <RSVPStatic>sequelize.define(
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

export default init;
