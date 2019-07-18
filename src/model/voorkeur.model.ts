import { Model } from 'sequelize';
import { IMarktondernemerVoorkeurRow } from '../markt.model';

export class Voorkeur extends Model<IMarktondernemerVoorkeurRow, IMarktondernemerVoorkeurRow>
    implements IMarktondernemerVoorkeurRow {
    public erkenningsNummer!: string;
    public marktId: string;
    public marktDate: string | null;
    public monday: boolean | null;
    public tuesday: boolean | null;
    public wednesday: boolean | null;
    public thursday: boolean | null;
    public friday: boolean | null;
    public saturday: boolean | null;
    public sunday: boolean | null;
    public anywhere: boolean | null;
    public minimum?: number | null;
    public maximum?: number | null;
    public brancheId: string | null;
    public parentBrancheId: string | null;
    public inrichting: string | null;
    public inactive: boolean | null;
}
