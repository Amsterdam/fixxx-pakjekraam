import PropTypes, { ValidationMap } from 'prop-types';
import * as React from 'react';
import EmailContent from '../EmailContent.jsx';
import { formatDate, formatDayOfWeek } from '../../../util';
import { IMarkt, IMarktondernemer } from '../../../markt.model';

export type EmailSollNoPlaatsConfirmProps = {
    markt: IMarkt;
    marktDate: string;
    ondernemer: IMarktondernemer;
};

export class EmailSollNoPlaatsConfirm extends React.Component {
    public propTypes: ValidationMap<EmailSollNoPlaatsConfirmProps> = {
        markt: PropTypes.any.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.any.isRequired,
    };

    public render() {
        const { markt, marktDate, ondernemer } = this.props as EmailSollNoPlaatsConfirmProps;
        const date = `${formatDayOfWeek(marktDate)} ${formatDate(marktDate)}`;

        return (
            <EmailContent>
                <p>Beste {ondernemer.description},</p>

                <p>
                    Er is morgen ({date}) helaas GEEN plaats op de markt {markt.naam} voor u.
                    <br />
                    De markt is vol.
                </p>

                <p>
                    Met vriendelijke groet,
                    <br />
                    Marktbureau Amsterdam
                </p>
            </EmailContent>
        );
    }
}
