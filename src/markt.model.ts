export type PlaatsId = string;

export type ErkenningsNummer = string;

export type BrancheId = string;

export enum KraamInrichting {
    EIGEN_MATERIEEL = 'eigen-materieel'
}

export enum ObstakelType {
    LOOPJE = 'loopje',
    OPTIONAL_LOOPJE = 'loopjediedichtmag',
    LANTAARNPAAL = 'lantaarnpaal',
    BOOM = 'boom',
    BANKJE = 'bankje'
}

export enum VerkoopinrichtingType {
    EIGEN_MATERIEEL = 'eigen-materieel'
}

export enum DeelnemerStatus {
    VASTE_PLAATS = 'vpl',
    TIJDELIJKE_VASTE_PLAATS = 'vkk',
    SOLLICITANT = 'soll'
}

export interface IMarktProperties {
    marktId?: string;
    marktDate?: string;
    naam?: string;
    expansionLimit?: number;
    rows?: string[][];
}

export interface IMarkt {
    marktId: string;
    marktDate: string;
    naam: string;
    branches: IBranche[];
    rows: IMarktplaats[][];
    marktplaatsen: IMarktplaats[];
    voorkeuren: IPlaatsvoorkeur[];
    ondernemers: IMarktondernemer[];
    obstakels: IObstakelBetween[];
    expansionLimit?: number;
}

export interface IMarktindelingSeed {
    aanwezigheid: IRSVP[];
    aLijst: IMarktondernemer[];
}

export interface IMarktindeling extends IMarkt, IMarktindelingSeed {
    toewijzingQueue: IMarktondernemer[];
    openPlaatsen: IMarktplaats[];
    afwijzingen: IAfwijzing[];
    toewijzingen: IToewijzing[];
}

export interface IRSVP {
    // `id` is used by Sequelize
    id?: number;
    marktId: string;
    marktDate: string;
    erkenningsNummer: ErkenningsNummer;
    attending: boolean;
}

export interface IMarktdeelnemer {}

// TODO: Implement 'standwerker' en 'promoplek' als `IMarktdeelnemer`

export interface IMarktondernemerVoorkeur {
    erkenningsNummer: string;
    marktId?: string;
    marktDate?: string;
    minimum?: number;
    maximum?: number;
    krachtStroom?: boolean;
    kraaminrichting?: KraamInrichting;
    anywhere?: boolean;
    absentFrom?: Date;
    absentUntil?: Date;
    branches?: BrancheId[];
    verkoopinrichting?: string[];
}

export interface IMarktondernemerVoorkeurRow {
    erkenningsNummer: string;
    marktId?: string;
    marktDate?: string;
    minimum?: number;
    maximum?: number;
    krachtStroom?: boolean;
    kraaminrichting?: KraamInrichting;
    anywhere?: boolean;
    inactive?: boolean;
    absentFrom?: Date;
    absentUntil?: Date;
    brancheId?: BrancheId;
    parentBrancheId?: BrancheId;
    inrichting?: string;
}

export interface IMarktondernemer extends IMarktdeelnemer {
    description: string;
    erkenningsNummer: ErkenningsNummer;
    sollicitatieNummer: number;
    plaatsen?: PlaatsId[];
    status: DeelnemerStatus;
    voorkeur?: IMarktondernemerVoorkeur;
}

export interface IMarktplaats {
    plaatsId: PlaatsId;
    properties?: string[];
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
    marktId: string;
    marktDate: string;
    plaatsen: PlaatsId[];
    erkenningsNummer: ErkenningsNummer;
    ondernemer?: IMarktondernemer;
}

export interface IAfwijzingReason {
    message: string;
    code?: number;
}

export interface IAfwijzing {
    marktId: string;
    marktDate: string;
    erkenningsNummer: string;
    ondernemer: IMarktondernemer;
    reason: IAfwijzingReason;
}

export interface IBranche {
    description: string;
    brancheId: BrancheId;
    maximumPlaatsen?: number;
    maximumToewijzingen?: number;
    verplicht?: boolean;
}

export interface IPlaatsvoorkeur {
    erkenningsNummer: ErkenningsNummer;
    marktId: string;
    plaatsId: PlaatsId;
    priority: number;
}

export interface IPlaatsvoorkeurRow {
    // `id` is used by Sequelize
    id?: number;
    marktId: string;
    erkenningsNummer: string;
    plaatsId: string;
    priority: number;
}

export interface IMarktInfo {
    telefoonnummer: string;
    erkenningsNummer: ErkenningsNummer;
    marktdagen: string;
    indelingstijdstip: string;
}
