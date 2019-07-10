import { Model } from 'sequelize';

export class RSVP extends Model {
    public id!: number;
    public marktId!: number;
    public marktDate!: string;
    public erkenningsNummer!: string;
    public attending!: boolean;
}
