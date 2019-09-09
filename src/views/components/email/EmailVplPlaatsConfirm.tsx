import PropTypes, { ValidationMap } from 'prop-types';
import * as React from 'react';
import EmailContent from '../EmailContent.jsx';
import EmailTable from '../EmailTable.jsx';
import { flatten, formatDate, fullRelativeHumanDate, capitalize, arrayToObject } from '../../../util';
import { IMarkt, IMarktplaats, IMarktondernemer, IPlaatsvoorkeur, IBranche } from '../../../markt.model';

export type EmailVplPlaatsConfirmProps = {
    markt: IMarkt;
    marktplaatsen: IMarktplaats[];
    marktDate: string;
    ondernemer: IMarktondernemer;
    voorkeuren: IPlaatsvoorkeur[];
    branches: IBranche[];
    telefoonnummer: string;
};

export class EmailVplPlaatsConfirm extends React.Component {
    public propTypes: ValidationMap<EmailVplPlaatsConfirmProps> = {
        markt: PropTypes.any.isRequired,
        marktplaatsen: PropTypes.array.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.any.isRequired,
        voorkeuren: PropTypes.array,
        branches: PropTypes.array,
        telefoonnummer: PropTypes.string,
    };

    public render() {
        const { markt, marktplaatsen, marktDate, ondernemer, voorkeuren, branches, telefoonnummer } = this
            .props as EmailVplPlaatsConfirmProps;
        const fontGray = { color: '#767676' };
        const marktBranches = arrayToObject(marktplaatsen.filter(plaats => plaats.branches), 'plaatsId');

        const bijzonderheden = ondernemer.plaatsen
            .map(plaatsId => marktplaatsen.find(p => p.plaatsId === plaatsId))
            .filter(Boolean)
            .map(plaats => plaats.properties || [])
            .reduce(flatten, []);

        const branchesObj = arrayToObject(branches, 'brancheId');
        const ondernemerPlaatsBranches = (ondernemer.plaatsen || []).map(plaatsId => {
            const plaatsBranches =
                marktBranches[plaatsId] &&
                marktBranches[plaatsId].branches &&
                marktBranches[plaatsId].branches
                    .map(br => (branchesObj[br] ? branchesObj[br].description : null))
                    .filter(br => br)
                    .join(' ');

            return plaatsBranches ? plaatsBranches : 'geen';
        });

        const tableData = [
            [
                'Plaats nrs:',
                <span key="plaats">
                    <strong>{(ondernemer.plaatsen || []).join(', ')}</strong> (Uw vaste plaatsen)
                    <br /> {voorkeuren.length ? 'Je hebt helaas geen van je voorkeuren gekregen' : null}
                </span>,
            ],
            ['Soortplaats:', <strong key="Soortplaats">{ondernemerPlaatsBranches.join(', ')}</strong>],
            [
                'Bijzonderheden:',
                <strong key="remarks">{bijzonderheden.length ? bijzonderheden.join(' ') : 'geen'}</strong>,
            ],
            ['Markt:', <strong key="markt">{markt.naam}</strong>],
            ['Datum:', <strong key="date">{formatDate(marktDate)}</strong>],
        ];

        return (
            <EmailContent>
                <p>Beste {ondernemer.description},</p>

                <EmailContent>
                    <p>
                        {capitalize(fullRelativeHumanDate(marktDate))} is uw plaats op de {markt.naam}
                    </p>
                    <EmailTable data={tableData} />
                </EmailContent>
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
