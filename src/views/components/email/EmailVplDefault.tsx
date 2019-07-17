import PropTypes, { ValidationMap } from 'prop-types';
import * as React from 'react';
import EmailContent from '../EmailContent.jsx';
import { IMarkt, IMarktondernemer } from '../../../markt.model';

export type EmailVplDefaultProps = {
    markt: IMarkt;
    ondernemer: IMarktondernemer;
};

export class EmailVplDefault extends React.Component {
    public propTypes: ValidationMap<EmailVplDefaultProps> = {
        markt: PropTypes.any.isRequired,
        ondernemer: PropTypes.any.isRequired,
    };

    public render() {
        const { markt, ondernemer } = this.props as EmailVplDefaultProps;

        return (
            <EmailContent>
                <p>Beste {ondernemer.description},</p>

                <EmailContent>
                    <p>Je hebt je morgen voor de mark {markt.naam} niet aangemeld.</p>
                </EmailContent>

                <p>
                    Met vriendelijke groet,
                    <br />
                    Marktbureau Amsterdam
                </p>
            </EmailContent>
        );
    }
}
