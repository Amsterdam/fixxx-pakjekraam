const { Model } = require('sequelize');

export class Voorkeur extends Model {
    public erkenningsNummer!: string;
    public marktId: number;
    public marktDate: string;
    public monday: boolean;
    public tuesday: boolean;
    public wednesday: boolean;
    public thursday: boolean;
    public friday: boolean;
    public saturday: boolean;
    public sunday: boolean;
    public anywhere: boolean;
    public aantalPlaatsen: number;
    public brancheId: string;
    public parentBrancheId: string;
    public inrichting: string;
    public inactive: boolean;
}
