import { Model } from 'sequelize';
import { IMarktondernemerVoorkeurRow } from '../markt.model';

export class Voorkeur extends Model<IMarktondernemerVoorkeurRow, IMarktondernemerVoorkeurRow>
    implements IMarktondernemerVoorkeurRow {
    public erkenningsNummer!: string;
    public marktId: string;
    public marktDate: string | null;
    public anywhere: boolean | null;
    public minimum?: number | null;
    public maximum?: number | null;
    public brancheId: string | null;
    public parentBrancheId: string | null;
    public inrichting: string | null;
    public inactive: boolean | null;
    public absentFrom: Date | null;
    public absentUntil: Date | null;
}
