import { Model } from 'sequelize';
import { IToewijzing } from '../markt.model';

export class Allocation extends Model<IToewijzing, IToewijzing> {
    public id!: number;
    public marktId!: string;
    public marktDate!: string;
    public plaatsId!: string;
    public erkenningsNummer!: string;
}
