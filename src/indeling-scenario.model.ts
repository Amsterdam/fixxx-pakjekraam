import {
    DeelnemerStatus,
    IBranche,
    IMarktondernemer,
    IMarktondernemerVoorkeur,
    IPlaatsvoorkeur,
    IMarktplaats,
    IRSVP,
} from './markt.model';

export interface IMarktScenario {
    id: number;
    marktDate: string;
    aanwezigheid: IRSVP[];
    marktplaatsen: IMarktplaats[];
    voorkeuren: IPlaatsvoorkeur[];
    ondernemers: IMarktondernemer[];
    aLijst: IMarktondernemer[];
    branches: IBranche[];
    rows: IMarktplaats[][];
}

export interface IMarktScenarioStub {
    aanwezigheid?: IRSVP[];
    marktplaatsen?: IMarktplaats[];
    ondernemers?: IMarktondernemer[];
    voorkeuren?: IPlaatsvoorkeur[];
    aLijst?: IMarktondernemer[];
    branches?: IBranche[];
    rows?: IMarktplaats[][];
}

export interface IMarktplaatsStub {
    plaatsId?: string;
    branches?: string[];
}

export interface IMarktondernemerStub {
    erkenningsNummer?: string;
    sollicitatieNummer?: number;
    status?: DeelnemerStatus;
    plaatsen?: string[];
    voorkeur?: IMarktondernemerVoorkeur;
}

export interface IPlaatsvoorkeurStub {
    plaatsId: string;
    erkenningsNummer?: string;
    sollicitatieNummer?: number;
    priority?: number;
}

export interface IRSVPStub {
    plaatsId: string;
    erkenningsNummer?: string;
    sollicitatieNummer?: number;
    attending?: boolean;
}
