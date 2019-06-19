const PropTypes = require('prop-types');
const React = require('react');
const { paginate } = require('../../util.js');
const Button = require('./Button');

const OndernemerMarktVoorkeuren = ({ plaatsvoorkeuren, markt, ondernemer, query }) => {
    const voorkeurEntries = plaatsvoorkeuren
        .map((voorkeur, index) => {
            return {
                marktId: markt.id,
                plaatsId: voorkeur.plaatsId,
                priority: voorkeur.priority,
            };
        })
        .sort((a, b) => b.priority - a.priority);
    const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id);

    return (
        <div className="OndernemerVoorkeuren">
            <h3>Plaatsvoorkeuren</h3>
            {sollicitatie.status === 'vpl' ? (
                <div>
                    <h4>
                        Je vaste plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null}:{' '}
                        {sollicitatie.vastePlaatsen.join(' & ')}
                    </h4>
                </div>
            ) : null}
            {voorkeurEntries ? (
                <div key="voorkeuren">
                    <ul>
                        {paginate(
                            voorkeurEntries,
                            sollicitatie.status === 'vpl' ? sollicitatie.vastePlaatsen.length : 1,
                        ).map((entry, i) => (
                            <li key={`${i + 1}e keuze`}>
                                {i + 1}e keuze: <strong>{entry.map(e => e.plaatsId).join(' & ')}</strong>
                            </li>
                        ))}
                    </ul>
                    <Button
                        label="Wijzig plaatsvoorkeuren"
                        type={`secondary`}
                        href={`/voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/?next=/dashboard/${
                            ondernemer.erkenningsnummer
                        }`}
                    />
                </div>
            ) : null}
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
