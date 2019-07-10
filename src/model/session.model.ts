const { Model } = require('sequelize');

export class Session extends Model {
    public sid!: string;
    public sess!: Object;
    public expire!: Date;
}
