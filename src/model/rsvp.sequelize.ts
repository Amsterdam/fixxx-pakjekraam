import { Sequelize, DataTypes, Model } from 'sequelize';
import { IRSVP } from '../markt.model';

export class RSVPModel extends Model<IRSVP, IRSVP> implements IRSVP {
    public id!: number;
    public marktId!: string;
    public marktDate!: string;
    public erkenningsNummer!: string;
    public attending!: boolean;
}

export const initRSVP = (sequelize: Sequelize) => {
    // const fields: SequelizeAttributes<RSVP> = {
    const attributes = {
        marktId: DataTypes.INTEGER,
        marktDate: DataTypes.DATEONLY,
        erkenningsNummer: DataTypes.STRING,
        attending: DataTypes.BOOLEAN,
    };

    RSVPModel.init(attributes, {
        modelName: 'rsvp',
        freezeTableName: true,
        sequelize,
        tableName: 'rsvp',
    });

    return RSVPModel;
};

export default initRSVP;
