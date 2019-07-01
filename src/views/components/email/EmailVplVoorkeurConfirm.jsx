const PropTypes = require('prop-types');
const React = require('react');
const EmailContent = require('../EmailContent.jsx');
const EmailTable = require('../EmailTable.jsx');
const { formatDate } = require('../../../util.js');
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
        voorkeuren: PropTypes.object,
    };

    render() {
        const { markt, marktDate, ondernemer, toewijzing, afwijzing, inschrijving, voorkeuren } = this.props;
        const verplaatsText = 'De verplaating, die je met je plaatsvoorkeuren hebt aangevraagd, is toegewezen';
        const uitbreidingText = `De uitbreiding, op je vasteplaats${
            ondernemer.plaatsen.length > 1 ? 'en' : ''
        } die je hebt aangevraagd, is toegewezen`;
        const uitbreidingVerplaatsText = `De verplaatsing en uitbreiding, die je hebt aangevraagd, is toegewezen.`;
        const verplaatsGeenUitbreidingText = `De verplaatsing, die je hebt aangevraagd, is toegewezen. De uitbreiding van je vasteplaats${
            ondernemer.plaatsen.length > 1 ? 'en' : ''
        }, is helaas niet gelukt.`;

        console.log(markt.branches);
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
        const uitbreiding = toewijzing.plaatsen.length > ondernemer.plaatsen;
        const uitbreidingVastePlaatsen = toewijzing.plaatsen
            .sort()
            .join('-')
            .includes(ondernemer.plaatsen.sort().join('-'));
        const toewijzingsText = !uitbreiding
            ? verplaatsText
            : voorkeuren.length === 1 && uitbreidingVastePlaatsen
            ? uitbreidingText
            : uitbreidingVerplaatsText;
        const tableData = [
            ['Plaats nrs:', `${toewijzing.plaatsen.join(', ')}`],
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
                    <p>{toewijzingsText}</p>
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

module.exports = EmailVplVoorkeurConfirm;
