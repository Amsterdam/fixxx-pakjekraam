const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const EmailTable = require('../EmailTable.jsx');
const { formatDate, formatDayOfWeek, arrayToObject } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailSollPlaatsConfirm extends React.Component {
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
        const branches = arrayToObject(markt.marktplaatsen.filter(plaats => plaats.branches), 'plaatsId');
        const tableData = [
            ['Plaats nrs:', <strong key={`plaats`}>Wordt tijdens loting om 09:00 uur bepaald</strong>],
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
                <p>
                    U heeft u aangemeld voor een plaats op de markt {markt.markt.naam} op {formatDayOfWeek(marktDate)}{' '}
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

module.exports = EmailSollPlaatsConfirm;
