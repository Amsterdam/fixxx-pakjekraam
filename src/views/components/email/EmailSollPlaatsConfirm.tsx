import PropTypes, { ValidationMap } from 'prop-types';
import * as React from 'react';
import EmailContent from '../EmailContent.jsx';
import EmailTable from '../EmailTable.jsx';
import { formatDate, formatDayOfWeek } from '../../../util';
import { IMarkt, IMarktondernemer, IPlaatsvoorkeur } from '../../../markt.model';

export type EmailSollPlaatsConfirmProps = {
    markt: IMarkt;
    marktDate: string;
    ondernemer: IMarktondernemer;
    voorkeuren: IPlaatsvoorkeur[];
    telefoonnummer: string;
};

export class EmailSollPlaatsConfirm extends React.Component {
    public propTypes: ValidationMap<EmailSollPlaatsConfirmProps> = {
        markt: PropTypes.any.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.any.isRequired,
        voorkeuren: PropTypes.array,
        telefoonnummer: PropTypes.string
    };

    public render() {
        const fontGray = { color: '#767676' };
        const { markt, marktDate, ondernemer, voorkeuren, telefoonnummer } = this.props as EmailSollPlaatsConfirmProps;
        const tableData = [
            ['Plaats nrs:', <strong key="plaats">Wordt tijdens loting om 09:00 uur bepaald</strong>],
            ['Markt:', <strong key="markt">{markt.naam}</strong>],
            [
                'Datum:',
                <strong key="date">
                    {formatDayOfWeek(marktDate)} {formatDate(marktDate)}
                </strong>,
            ],
        ];

        return (
            <EmailContent>
                <p>Beste {ondernemer.description},</p>
                <p>
                    U hebt u aangemeld voor een plaats op de markt {markt.naam} op {formatDayOfWeek(marktDate)}{' '}
                    {formatDate(marktDate)}.
                </p>
                {voorkeuren.length ? (
                    <p>Geen van uw voorkeuren is beschikbaar maar er zijn nog vrije plaatsen.</p>
                ) : null}
                <p>
                    U bent zeker van een plek. Kom naar de loting dan krijgt u voorrang op koopmannen die zich niet
                    hebben aangemeld.{' '}
                </p>

                <EmailTable data={tableData} />

                <EmailContent>
                    <p style={fontGray}>
                        Als u onverwachts toch niet kunt komen verzoeken wij u dit uiterlijk 08.45 uur aan de
                        marktmeester te melden zodat een andere koopman uw plaats kan krijgen.
                    </p>
                    {telefoonnummer ? (
                    <p style={fontGray}>
                        Dit kan telefonisch via: {telefoonnummer}.
                    </p>) : null }
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
