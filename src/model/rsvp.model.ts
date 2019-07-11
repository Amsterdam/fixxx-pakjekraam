import { Model } from 'sequelize';
import { IRSVP } from '../markt.model';

export class RSVP extends Model<IRSVP, IRSVP> implements IRSVP {
    public id!: number;
    public marktId!: string;
    public marktDate!: string;
    public erkenningsNummer!: string;
    public attending!: boolean;
}
