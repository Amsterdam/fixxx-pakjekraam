export type PlaatsId = string;

export type ErkenningsNummer = string;

export type BrancheId = string;

export enum KraamInrichting {
    EIGEN_MATERIEEL = 'eigen-materieel',
}

export enum ObstakelType {
    LOOPJE = 'loopje',
    OPTIONAL_LOOPJE = 'loopjediedichtmag',
    LANTAARNPAAL = 'lantaarnpaal',
    BOOM = 'boom',
    BANKJE = 'bankje',
}

export enum VerkoopinrichtingType {
    EIGEN_MATERIEEL = 'eigen-materieel',
}

export enum DeelnemerStatus {
    VASTE_PLAATS = 'vpl',
    TIJDELIJKE_VASTE_PLAATS = 'vkk',
    SOLLICITANT = 'soll',
}

export interface IMarkt {
    id: number;
    naam: string;
    branches: IBranche[];
    rows: IMarktplaats[][];
    marktplaatsen: IMarktplaats[];
    voorkeuren: IPlaatsvoorkeur[];
    ondernemers: IMarktondernemer[];
    expansionLimit: number;
}

export interface IMarktindelingSeed {
    aanwezigheid: IRSVP[];
    aLijst: IMarktondernemer[];
}

export interface IRSVP {
    marktId: number;
    marktDate: string;
    erkenningsNummer: ErkenningsNummer;
    attending: boolean;
}

export interface IMarktdeelnemer {}

// TODO: Implement 'standwerker' en 'promoplek' als `IMarktdeelnemer`

export interface IMarktondernemerVoorkeur {
    aantalPlaatsen?: number;
    krachtStroom?: boolean;
    kraaminrichting?: KraamInrichting;
}

export interface IMarktondernemer extends IMarktdeelnemer {
    description: string;
    erkenningsNummer: ErkenningsNummer;
    sollicitatieNummer: number;
    plaatsen?: PlaatsId[];
    status: DeelnemerStatus;
    branches?: BrancheId[];
    voorkeur?: IMarktondernemerVoorkeur;
    verkoopinrichting?: string[];
}

export interface IMarktplaats {
    plaatsId: PlaatsId;
    tags?: string[];
    branches?: BrancheId[];
    verkoopinrichting?: string[];
    inactive?: boolean;
}

export interface IObstakelAt {
    kraam: string;
    obstakel: ObstakelType;
}

export interface IObstakelBetween {
    kraamA: string;
    kraamB: string;
    obstakel: ObstakelType;
}

export interface IToewijzing {
    plaatsen: PlaatsId[];
    erkenningsNummer: ErkenningsNummer;

    // TODO: Remove ondernemer, only keep `erkenningsNummer`
    ondernemer: IMarktondernemer;
}

export interface IAfwijzingReason {
    message: string;
    code?: number;
}

export interface IAfwijzing {
    ondernemer: IMarktondernemer;
    reason: IAfwijzingReason;
}

export interface IMarktindelingState extends IMarkt {
    toewijzingQueue: IMarktondernemer[];
    openPlaatsen: IMarktplaats[];
    expansionQueue: IToewijzing[];
    expansionIteration: number;
}

export interface IMarktindeling extends IMarkt, IMarktindelingSeed, IMarktindelingState {
    afwijzingen: IAfwijzing[];
    toewijzingen: IToewijzing[];
}

export interface IBranche {
    brancheId: BrancheId;
    maximum?: number;
    verplicht?: boolean;
}

export interface IPlaatsvoorkeur {
    erkenningsNummer: ErkenningsNummer;
    marktId: number;
    plaatsId: PlaatsId;
    priority: number;
}
