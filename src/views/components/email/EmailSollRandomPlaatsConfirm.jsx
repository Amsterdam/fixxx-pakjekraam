const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const EmailTable = require('../EmailTable.jsx');
const { formatDate, fullRelativeHumanDate, capitalize } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailSollRandomPlaatsConfirm extends React.Component {
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
        const fontGray = { color: '#767676' };
        const { markt, marktDate, ondernemer, toewijzing, afwijzing, inschrijving, voorkeuren } = this.props;

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

        const tableData = [
            [
                'Plaats nrs:',
                <span key={`plaats`}>
                    <strong>{toewijzing.plaatsen.join(', ')}</strong>
                    <br />
                    Dit is een voorkeursplaats die je hebt aangevraagd
                </span>,
            ],
            ['Soortplaats:', <strong key={`branche`}>fixme</strong>],
            [
                'Bijzonderheden:',
                <strong key={`remarks`}>{bijzonderheden.length ? bijzonderheden.join(' ') : 'geen'}</strong>,
            ],
            ['Markt:', <strong key={`markt`}>{markt.markt.naam}</strong>],
            [
                'Datum:',
                <strong key={`date`}>
                    {formatDayOfWeek(marktDate)} {formatDate(marktDate)}
                </strong>,
            ],
        ];

        return (
            <EmailContent>
                <p>Beste {ondernemer.description},</p>

                <EmailContent>
                    <p>
                        {capitalize(fullRelativeHumanDate(marktDate))} is er plaats voor je op de markt{' '}
                        {markt.markt.naam}
                    </p>
                    <EmailTable data={tableData} />
                </EmailContent>
                <EmailContent>
                    <p style={fontGray}>
                        Als je bijvoorbeeld door ziekte toch niet kunt komen verzoeken wij je dit uiterlijk 08:45 aan de
                        marktmeester telefonisch te melden zodat een andere koopman je plaats kan krijgen.
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

module.exports = EmailSollRandomPlaatsConfirm;
