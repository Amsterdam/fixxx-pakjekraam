const PropTypes = require('prop-types');
const React = require('react');
const EmailBase = require('./components/EmailBase.jsx');
const EmailContent = require('./components/EmailContent.jsx');
const { formatDate } = require('../util.js');
const { isVast } = require('../domain-knowledge.js');

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
        const voorkeurenObjectGroupedByPrio = (voorkeuren || []).reduce(function(hash, voorkeur) {
            if (!hash.hasOwnProperty(voorkeur.dataValues.priority)) hash[voorkeur.dataValues.priority] = [];
            hash[voorkeur.dataValues.priority].push(voorkeur.dataValues);
            return hash;
        }, {});
        const voorkeurenGroupedByPrio = Object.keys(voorkeurenObjectGroupedByPrio)
            .map(function(key) {
                return voorkeurenObjectGroupedByPrio[key];
            })
            .sort((a, b) => b[0].priority - a[0].priority);
        return (
            <EmailBase
                lang="nl"
                appName={`Pak je kraam`}
                domain={`pakjekraam.amsterdam.nl`}
                subject={`Indeling ${markt.markt.naam} ${formatDate(marktDate)}`}
            >
                <EmailContent>
                    <h2>Plaatsvoorkeur wijziging voor {markt.markt.naam}</h2>
                    <p>Beste {ondernemer.description},</p>
                    {voorkeurenGroupedByPrio.length ? (
                        <EmailContent>
                            <p>Uw nieuwe plaatsvoorkeurenlijst ziet er volgt uit.</p>
                            <ul>
                                {voorkeurenGroupedByPrio.map((voorkeurenPrio, i) => (
                                    <li key={voorkeurenPrio[0].priority}>
                                        {i + 1}e keuze: {voorkeurenPrio.map(plaats => plaats.plaatsId).join(' en ')}
                                    </li>
                                ))}
                            </ul>
                        </EmailContent>
                    ) : (
                        <EmailContent>
                            <p>
                                <strong>U heeft al uw plaatsvoorkeuren verwijderd!</strong>
                            </p>
                        </EmailContent>
                    )}

                    <p>
                        Met vriendelijke groet,
                        <br />
                        Marktbureau Amsterdam
                    </p>
                </EmailContent>
            </EmailBase>
        );
    }
}

module.exports = EmailVplVoorkeurConfirm;
