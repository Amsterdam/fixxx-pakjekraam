import { Sequelize, DataTypes } from 'sequelize';
import { Plaatsvoorkeur } from './plaatsvoorkeur.model';

export const initPlaatsvoorkeur = (sequelize: Sequelize) => {
    const attributes = {
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
    };

    Plaatsvoorkeur.init(attributes, {
        modelName: 'plaatsvoorkeur',
        freezeTableName: true,
        sequelize,
        tableName: 'plaatsvoorkeur',
    });

    return Plaatsvoorkeur;
};

export default initPlaatsvoorkeur;
