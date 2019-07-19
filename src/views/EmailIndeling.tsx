import PropTypes, { ValidationMap } from 'prop-types';
import * as React from 'react';
import EmailBase from './components/EmailBase.jsx';
import EmailContent from './components/EmailContent.jsx';
import { isVast } from '../domain-knowledge.js';
import { EmailVplVoorkeurConfirm } from './components/email/EmailVplVoorkeurConfirm';
import { EmailSollNoPlaatsConfirm } from './components/email/EmailSollNoPlaatsConfirm';
import { EmailSollPlaatsConfirm } from './components/email/EmailSollPlaatsConfirm';
// import { EmailSollRandomPlaatsConfirm } from './components/email/EmailSollRandomPlaatsConfirm';
import { EmailSollVoorkeurConfirm } from './components/email/EmailSollVoorkeurConfirm';
import { EmailVplPlaatsConfirm } from './components/email/EmailVplPlaatsConfirm';
import { EmailVplDefault } from './components/email/EmailVplDefault';
import {
    IAfwijzing,
    IBranche,
    IMarkt,
    IMarktplaats,
    IMarktondernemer,
    IPlaatsvoorkeur,
    IRSVP,
    IToewijzing,
} from '../markt.model';

export type EmailIndelingProps = {
    markt: IMarkt;
    marktplaatsen: IMarktplaats[];
    marktDate: string;
    ondernemer: IMarktondernemer;
    toewijzing: IToewijzing;
    afwijzing: IAfwijzing;
    voorkeuren: IPlaatsvoorkeur[];
    aanmeldingen: IRSVP[];
    branches: IBranche[];
    subject: string;
};

export class EmailIndeling extends React.Component {
    public propTypes: ValidationMap<EmailIndelingProps> = {
        markt: PropTypes.any.isRequired,
        marktplaatsen: PropTypes.array.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.any.isRequired,
        toewijzing: PropTypes.any,
        afwijzing: PropTypes.any,
        voorkeuren: PropTypes.array,
        aanmeldingen: PropTypes.array,
        branches: PropTypes.array,
        subject: PropTypes.string,
    };

    public render() {
        const { ondernemer, toewijzing, afwijzing, voorkeuren, subject } = this.props as EmailIndelingProps;

        let template;

        if (isVast(ondernemer.status)) {
            template = <EmailVplDefault {...this.props} />;
            if (!voorkeuren.length) {
                template = <EmailVplPlaatsConfirm {...this.props} />;
            } else {
                template = <EmailVplVoorkeurConfirm {...this.props} />;
            }
        } else {
            template = <EmailSollNoPlaatsConfirm {...this.props} />;
            if (!afwijzing && !toewijzing) {
                template = <EmailSollPlaatsConfirm {...this.props} />;
            } else if (voorkeuren.length && !afwijzing && toewijzing) {
                template = <EmailSollVoorkeurConfirm {...this.props} />;
            }
        }

        return (
            <EmailBase lang="nl" appName="Kies je kraam" domain="kiesjekraam.amsterdam.nl" subject={subject}>
                {template ? template : <EmailContent />}
            </EmailBase>
        );
    }
}

export default EmailIndeling;
