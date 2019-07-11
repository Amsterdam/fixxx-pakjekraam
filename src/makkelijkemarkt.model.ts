export enum DeelnemerStatus {
    VASTE_PLAATS = 'vpl',
    TIJDELIJKE_VASTE_PLAATS = 'vkk',
    SOLLICITANT = 'soll',
}

export interface MMSession {
    uuid: string;
    creationDate: number;
    lifeTime: number;
}

export interface MMMarktRef {
    id: number;
    naam: string;
    afkorting: string;
}

export interface MMMarkt {
    id: number;
    afkorting: string;
    naam: string;
    geoArea: any;
    soort: string;
    marktDagen: string[];
    standaardKraamAfmeting: number;
    extraMetersMogelijk: boolean;
    aanwezigeOpties: {
        '3mKramen': boolean;
        '4mKramen': boolean;
        extraMeters: boolean;
        elektra: boolean;
        afvaleiland: boolean;
    };
    perfectViewNummer: number;
    aantalKramen: number;
    aantalMeter: number;
    auditMax: number;
}

export interface MMOndernemer {
    id: number;
    erkenningsnummer: string;
    voorletters: string;
    tussenvoegsels: string;
    achternaam: string;
    telefoon: string;
    email: string;
    handhavingsVerzoek?: any; // unknown type
    fotoUrl: string;
    fotoMediumUrl: string;
    status: string;
    perfectViewNummer: number;
    weging: number;
    pasUid: string;
    vervangers: MMVervanger[];
}

export interface MMOndernemerStandalone extends MMOndernemer {
    sollicitaties: MMSollicitatie[];
}

export interface MMVervanger {
    vervanger_id: number;
    pas_uid: string;
    erkenningsnummer: string;
    voorletters: string;
    tussenvoegsels: string;
    achternaam: string;
    telefoon: string;
    email: string;
    fotoUrl: string;
    fotoMediumUrl: string;
    status: string;
    perfectViewNummer: number;
}

export interface MMSollicitatie {
    id: number;
    sollicitatieNummer: number;
    status: DeelnemerStatus;
    vastePlaatsen: string[];
    aantal3MeterKramen: number;
    aantal4MeterKramen: number;
    aantalExtraMeters: number;
    aantalElektra: number;
    krachtstroom: boolean;
    doorgehaald: boolean;
    doorgehaaldReden: string;
    markt: MMMarktRef;
    koppelveld: any; // unkown
    aantalAfvaleiland: number;
}

export interface MMSollicitatieStandalone extends MMSollicitatie {
    koopman: MMOndernemer;
}
