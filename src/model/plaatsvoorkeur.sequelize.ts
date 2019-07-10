import { Sequelize, DataTypes, Model, BuildOptions } from 'sequelize';
import { Plaatsvoorkeur } from './plaatsvoorkeur.model';

type PlaatsvoorkeurStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): Plaatsvoorkeur;
};

const init = (sequelize: Sequelize) => {
    const plaatsVoorkeur = <PlaatsvoorkeurStatic>sequelize.define(
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

export default init;
