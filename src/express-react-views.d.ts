declare module 'express-react-views';

export class ReactViewsOptions {
    public doctype?: string;
    public beautify?: boolean;
    public transformViews?: boolean;
    public babel?: any;
}

export const createEngine = (options: ReactViewsOptions): Function => {};
