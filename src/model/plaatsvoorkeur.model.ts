import { Model } from 'sequelize';

export class Plaatsvoorkeur extends Model {
    public id!: number;
    public marktId!: number;
    public erkenningsNummer!: string;
    public plaatsId!: string;
    public priority!: number;
}
