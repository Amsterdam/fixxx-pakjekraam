import { Model } from 'sequelize';

export class Allocation extends Model {
    public id!: number;
    public marktId!: number;
    public marktDate!: string;
    public plaatsId!: string;
    public erkenningsNummer!: string;
}
