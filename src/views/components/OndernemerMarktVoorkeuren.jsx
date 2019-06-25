const PropTypes = require('prop-types');
const React = require('react');
const { paginate } = require('../../util.js');
const Button = require('./Button');
const HeaderTitleButton = require('./HeaderTitleButton');

const OndernemerMarktVoorkeuren = ({ plaatsvoorkeuren, markt, ondernemer, query }) => {
    const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id);
    const voorkeurEntries = plaatsvoorkeuren
        .map((voorkeur, index) => {
            return {
                marktId: voorkeur.dataValues.marktId,
                plaatsId: voorkeur.plaatsId,
                priority: voorkeur.priority,
            };
        })
        .sort((a, b) => b.priority - a.priority)
        .filter(m => m.marktId === markt.id);

    const voorkeurEntriesGrouped = paginate(
        voorkeurEntries,
        sollicitatie.status === 'vpl' ? sollicitatie.vastePlaatsen.length : 1,
    );

    return (
        <div className="OndernemerVoorkeuren">
            <HeaderTitleButton
                title="Plaatsvoorkeuren"
                url={`/voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/?next=/markt-detail/${
                    ondernemer.erkenningsnummer
                }/${markt.id}`}
            />
            <div className="well">
                {sollicitatie.status === 'vpl' ? (
                    <div className="margin-bottom">
                        <strong className="h4">{sollicitatie.vastePlaatsen.join(' & ')}</strong>{' '}
                        <span className="font-gray">
                            (vaste plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null})
                        </span>
                    </div>
                ) : null}
                {voorkeurEntriesGrouped.length ? (
                    <div className="margin-top" key="voorkeuren">
                        <strong>Dit zijn je plaatsvoorkeuren</strong>
                        <ul>
                            {voorkeurEntriesGrouped.map((entry, i) => (
                                <li key={`${i + 1}e keuze`}>
                                    {i + 1}e keuze: <strong>{entry.map(e => e.plaatsId).join(' & ')}</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>
                        <strong>Je hebt nog geen plaatsvoorkeuren doorgeven</strong>
                    </p>
                )}
                <span>
                    Je krijgt deze plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null} automatisch op de dagen
                    die je als &apos;aanwezig&apos; aangeeft.
                </span>
            </div>
        </div>
    );
};

OndernemerMarktVoorkeuren.propTypes = {
    plaatsvoorkeuren: PropTypes.array.isRequired,
    markt: PropTypes.object.isRequired,
    ondernemer: PropTypes.object.isRequired,
    query: PropTypes.string,
};

module.exports = OndernemerMarktVoorkeuren;
