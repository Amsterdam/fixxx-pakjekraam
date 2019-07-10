const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const EmailTable = require('../EmailTable.jsx');
const { formatDate, relativeHumanDay, capitalize, fullRelativeHumanDate, arrayToObject } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailVplVoorkeurConfirm extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        marktDate: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        toewijzing: PropTypes.object,
        afwijzing: PropTypes.object,
        inschrijving: PropTypes.object,
        voorkeuren: PropTypes.array,
    };

    render() {
        const { markt, marktDate, ondernemer, toewijzing, afwijzing, inschrijving, voorkeuren } = this.props;
        const fontGray = { color: '#767676' };
        const branches = arrayToObject(markt.marktplaatsen.filter(plaats => plaats.branches), 'plaatsId');

        const bijzonderheden = markt.marktplaatsen
            .reduce((t, plaats) => {
                ondernemer.plaatsen.map(p => {
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

        const uitbreiding = toewijzing.plaatsen.length > ondernemer.plaatsen.length;
        const verkleining = toewijzing.plaatsen.length < ondernemer.plaatsen.length;
        const isVastePlaats = toewijzing.plaatsen.sort().join('-') === ondernemer.plaatsen.sort().join('-');
        const uitbreidingVastePlaatsen = toewijzing.plaatsen
            .sort()
            .join('-')
            .includes(ondernemer.plaatsen.sort().join('-'));
        const verkleiningVastePlaatsen = ondernemer.plaatsen
            .sort()
            .join('-')
            .includes(toewijzing.plaatsen.sort().join('-'));

        const defaultText = 'Dit zijn uw vaste plaatsen. U heeft helaas geen van uw voorkeursplaats(en) gekregen.';
        const verplaatsText = 'Dit is een voorkeursplaats die u heeft aangevraagd.';
        const vekleiningText = `Dit is een verkleining van uw vaste plaats die u heeft aangevraagd`;
        const vekleiningVerplaatsText = `Dit is een verplaatsing en verkleining die u heeft aangevraagd`;
        const uitbreidingVerplaatsText = `Dit is een voorkeursplaats met extra plaats(en) die u heeft aangevraagd`;
        const uitbreidingNietVerplaatsText = `Dit is uw vaste plaats met extra plaats(en) die u heeft aangevraagd`;
        const verplaatsGeenUitbreidingText = `Dit is een voorkeursplaats die u heeft aangevraagd`;

        let toewijzingsText = isVastePlaats ? defaultText : verplaatsText;
        if (uitbreiding) {
            toewijzingsText = uitbreidingVastePlaatsen ? uitbreidingNietVerplaatsText : uitbreidingVerplaatsText;
        } else if (verkleining) {
            toewijzingsText = verkleiningVastePlaatsen ? vekleiningText : vekleiningVerplaatsText;
        }

        const tableData = [
            [
                'Plaats nrs:',
                <span key={`plaats`}>
                    <strong>{toewijzing.plaatsen.join(', ')}</strong>
                    <br />
                    {toewijzingsText}
                </span>,
            ],
            [
                'Soortplaats:',
                <strong>
                    {toewijzing.plaatsen
                        .map(plaatsId => (branches[plaatsId] ? branches[plaatsId].branches.join(' ') : 'geen'))
                        .join(', ')}
                </strong>,
            ],
            [
                'Bijzonderheden:',
                <strong key={`remarks`}>{bijzonderheden.length ? bijzonderheden.join(' ') : 'geen'}</strong>,
            ],
            ['Markt:', <strong key={`markt`}>{markt.markt.naam}</strong>],
            ['Datum:', <strong key={`date`}>{formatDate(marktDate)}</strong>],
        ];

        return (
            <EmailContent>
                <p>Beste {ondernemer.description},</p>

                <EmailContent>
                    <p>
                        {capitalize(fullRelativeHumanDate(marktDate))} is uw plaats op de markt {markt.markt.naam}
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

module.exports = EmailVplVoorkeurConfirm;
