import { Model } from 'sequelize';
import { IPlaatsvoorkeurRow } from '../markt.model';

export class Plaatsvoorkeur extends Model<IPlaatsvoorkeurRow, IPlaatsvoorkeurRow> implements IPlaatsvoorkeurRow {
    public id!: number;
    public marktId!: string;
    public erkenningsNummer!: string;
    public plaatsId!: string;
    public priority!: number;
}
