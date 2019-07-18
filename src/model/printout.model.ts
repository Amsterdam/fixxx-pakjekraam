export interface IMarketRow {
    type?: string;
    class: string;
    title: string;
    landmarkTop: string;
    landmarkBottom: string;
    plaatsList: string[];
}

export interface IMarketLandmark {
    type: string;
    title: string;
}

export interface IAllocationPrintoutPage {
    title: string;
    indelingslijstGroup: (IMarketRow | IMarketLandmark)[];
}

export type IAllocationPrintout = IAllocationPrintoutPage[];
