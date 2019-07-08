const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const EmailTable = require('../EmailTable.jsx');
const { formatDate, fullRelativeHumanDate, capitalize } = require('../../../util.js');
const { isVast } = require('../../../domain-knowledge.js');

const formatPlaatsen = plaatsIds => plaatsIds.join(', ');

class EmailVplPlaatsConfirm extends React.Component {
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
                    <strong>{ondernemer.plaatsen.join(', ')}</strong> (je vaste plaatsen)
                    <br /> {voorkeuren.length ? 'Je hebt helaas geen van je voorkeuren gekregen' : null}
                </span>,
            ],
            ['Soortplaats:', <strong key={`branche`}>fixme</strong>],
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
                        {capitalize(fullRelativeHumanDate(marktDate))} is jouw plaats op de {markt.markt.naam}
                    </p>
                    <EmailTable data={tableData} />
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
