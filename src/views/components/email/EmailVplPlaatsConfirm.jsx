const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const { formatDate } = require('../../../util.js');
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
                `${ondernemer.plaatsen.join(', ')} (je vaste plaatsen)${
                    voorkeuren ? 'Je hebt helaas niet 1 van je voorkeuren gekregen' : null
                }`,
            ],
            ['Soortplaats:', 'fixme'],
            ['Bijzonderheden:', `${bijzonderheden.length ? bijzonderheden.join(' ') : 'geen'}`],
            ['Markt:', `${markt.markt.naam}`],
            ['Datum:', `${formatDate(marktDate)}`],
        ];

        return (
            <EmailContent>
                <h2>Indeling voor {markt.markt.naam}</h2>
                <p>Beste {ondernemer.description},</p>

                <EmailContent>
                    <p>
                        {formatDate(marktDate)} is jouw plaats op de {markt.markt.naam}
                    </p>
                    <EmailTable data={tableData} />
                </EmailContent>
                <EmailContent>
                    <p>
                        Je vasteplaats{ondernemer.plaatsen.length > 1 ? 'en' : ''}{' '}
                        {ondernemer.plaatsen.length > 1 ? 'zijn' : 'is'}:{' '}
                        <strong>{ondernemer.plaatsen.join(', ')}</strong>
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
