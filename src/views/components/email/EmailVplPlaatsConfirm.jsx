const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const EmailTable = require('../EmailTable.jsx');
const { formatDate, fullRelativeHumanDate, capitalize, arrayToObject } = require('../../../util.ts');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailVplPlaatsConfirm extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktplaatsen: PropTypes.array.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        toewijzing: PropTypes.object,
        afwijzing: PropTypes.object,
        inschrijving: PropTypes.object,
        voorkeuren: PropTypes.array,
        branches: PropTypes.array,
    };

    render() {
        const {
            markt,
            marktplaatsen,
            marktDate,
            ondernemer,
            toewijzing,
            afwijzing,
            inschrijving,
            voorkeuren,
            branches,
        } = this.props;
        const fontGray = { color: '#767676' };
        const marktBranches = arrayToObject(marktplaatsen.filter(plaats => plaats.branches), 'plaatsId');
        const bijzonderheden = marktplaatsen
            .reduce((t, plaats) => {
                (ondernemer.plaatsen || []).map(p => {
                    p === plaats.plaatsId && plaats.properties && t.push(plaats.properties);
                });

                return t;
            }, [])
            .reduce((t, props) => {
                props.map(prop => {
                    t.push(prop);
                });

                return t;
            }, []);
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
                <span key={`plaats`}>
                    <strong>{(ondernemer.plaatsen || []).join(', ')}</strong> (Uw vaste plaatsen)
                    <br /> {voorkeuren.length ? 'Je hebt helaas geen van je voorkeuren gekregen' : null}
                </span>,
            ],
            ['Soortplaats:', <strong key={`Soortplaats`}>{ondernemerPlaatsBranches.join(', ')}</strong>],
            [
                'Bijzonderheden:',
                <strong key={`remarks`}>{bijzonderheden.length ? bijzonderheden.join(' ') : 'geen'}</strong>,
            ],
            ['Markt:', <strong key={`markt`}>{markt.naam}</strong>],
            ['Datum:', <strong key={`date`}>{formatDate(marktDate)}</strong>],
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

module.exports = EmailVplPlaatsConfirm;
