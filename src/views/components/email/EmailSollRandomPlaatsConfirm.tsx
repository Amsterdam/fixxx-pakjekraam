import PropTypes, { ValidationMap } from 'prop-types';
import * as React from 'react';
import EmailContent from '../EmailContent.jsx';
import EmailTable from '../EmailTable.jsx';
import { formatDate, fullRelativeHumanDate, capitalize, flatten, formatDayOfWeek, arrayToObject } from '../../../util';
import { IMarkt, IMarktplaats, IMarktondernemer, IToewijzing, IBranche } from '../../../markt.model';

export type EmailSollRandomPlaatsConfirmProps = {
    markt: IMarkt;
    marktplaatsen: IMarktplaats[];
    marktDate: string;
    ondernemer: IMarktondernemer;
    toewijzing: IToewijzing;
    branches: IBranche[];
};

export class EmailSollRandomPlaatsConfirm extends React.Component {
    public propTypes: ValidationMap<EmailSollRandomPlaatsConfirmProps> = {
        markt: PropTypes.any.isRequired,
        marktplaatsen: PropTypes.array.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.any.isRequired,
        toewijzing: PropTypes.any,
        branches: PropTypes.array,
    };

    public render() {
        const { markt, marktplaatsen, marktDate, ondernemer, toewijzing, branches } = this
            .props as EmailSollRandomPlaatsConfirmProps;
        const fontGray = { color: '#767676' };
        const branchesObj = arrayToObject(branches, 'brancheId');
        const marktBranches = arrayToObject(marktplaatsen.filter(plaats => plaats.branches), 'plaatsId');
        const ondernemerPlaatsBranches = toewijzing.plaatsen.map(plaatsId => {
            const plaatsBranches =
                marktBranches[plaatsId] &&
                marktBranches[plaatsId].branches &&
                marktBranches[plaatsId].branches
                    .map(br => (branchesObj[br] ? branchesObj[br].description : null))
                    .filter(br => br)
                    .join(' ');

            return plaatsBranches ? plaatsBranches : 'geen';
        });

        const bijzonderheden = ondernemer.plaatsen
            .map(plaatsId => marktplaatsen.find(p => p.plaatsId === plaatsId))
            .filter(Boolean)
            .map(plaats => plaats.properties || [])
            .reduce(flatten, []);

        const tableData = [
            [
                'Plaats nrs:',
                <span key="plaats">
                    <strong>{toewijzing.plaatsen.join(', ')}</strong>
                    <br />
                    Dit is een voorkeursplaats die u hebt aangevraagd
                </span>,
            ],
            ['Soortplaats:', <strong key="Soortplaats">{ondernemerPlaatsBranches.join(', ')}</strong>],
            [
                'Bijzonderheden:',
                <strong key="remarks">{bijzonderheden.length ? bijzonderheden.join(' ') : 'geen'}</strong>,
            ],
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

                <EmailContent>
                    <p>
                        {capitalize(fullRelativeHumanDate(marktDate))} is er plaats voor je op de markt {markt.naam}
                    </p>
                    <EmailTable data={tableData} />
                </EmailContent>
                <EmailContent>
                    <p style={fontGray}>
                        Als u bijvoorbeeld door ziekte toch niet kunt komen verzoeken wij u dit uiterlijk 08:45 aan de
                        marktmeester telefonisch te melden zodat een andere koopman uw plaats kan krijgen.
                    </p>
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
