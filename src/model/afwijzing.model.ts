import { Model } from 'sequelize';
import { IAfwijzing } from '../markt.model';

export class Afwijzing extends Model<IAfwijzing> {
    public id!: number;
    public marktId!: string;
    public marktDate!: string;
    public reasonCode!: number;
    public erkenningsNummer!: string;
}
