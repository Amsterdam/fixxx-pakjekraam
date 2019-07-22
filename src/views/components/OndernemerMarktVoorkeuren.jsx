const PropTypes = require('prop-types');
const React = require('react');
const { paginate } = require('../../util.ts');
const Button = require('./Button');
const HeaderTitleButton = require('./HeaderTitleButton');
const { isVast } = require('../../domain-knowledge.js');

const OndernemerMarktVoorkeuren = ({ plaatsvoorkeuren, markt, ondernemer, query, sollicitatie, voorkeur }) => {
    const blockUrl = `../../voorkeuren/${markt.id}/`;
    const entriesFiltered = plaatsvoorkeuren.filter(entry => entry.marktId === markt.id);
    const defaultPlaatsCount = isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1;
    const defaultVoorkeur = {
        minimum: defaultPlaatsCount,
        maximum: defaultPlaatsCount,
        anwhere: true,
        inactive: false,
    };
    const voorkeurDef = voorkeur || defaultVoorkeur;

    const entriesSplit = entriesFiltered
        .sort((a, b) => b.priority - a.priority)
        .reduce((t, e) => {
            !t.includes(e.priority) && t.push(e.priority);

            return t;
        }, [])
        .reduce((t, p) => {
            t.push(entriesFiltered.filter(e => e.priority === p));

            return t;
        }, []);

    return (
        <div className="OndernemerVoorkeuren background-link-parent" id="plaatsvoorkeuren">
            <a href={blockUrl} className="background-link" />
            <HeaderTitleButton title="Plaatsvoorkeuren" url={blockUrl} />
            <div className="well">
                {isVast(sollicitatie.status) ? (
                    <div className="margin-bottom">
                        <strong className="h5">Uw vaste plaatsen</strong>
                        <p>
                            <strong>{sollicitatie.vastePlaatsen.join(', ')}</strong>
                            <br />U krijgt deze plaatsen op de dagen waarop u bent aangemeld.
                        </p>
                    </div>
                ) : null}
                <div className="margin-bottom">
                    <dl>
                        <dt>Aantal plaatsen:</dt>
                        <dd>{voorkeurDef.minimum}</dd>
                        <dt>Extra plaatsen:</dt>
                        <dd>
                            {voorkeurDef.maximum !== voorkeurDef.minimum
                                ? parseInt(voorkeurDef.maximum, 10) - parseInt(voorkeurDef.minimum, 10)
                                : 'geen'}
                        </dd>
                    </dl>
                </div>
                {entriesSplit.length ? (
                    <div className="margin-top" key="voorkeuren">
                        <strong className="h5">Favoriete plaatsen</strong>
                        <ul>
                            {entriesSplit.map((entry, i) => (
                                <li key={`${i + 1}e keuze`}>
                                    {i + 1}e keuze: <strong>{entry.map(e => e.plaatsId).join(' & ')}</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>
                        {isVast(sollicitatie.status) ? (
                            <strong>
                                <u>Wilt u schuiven naar een ander plaats of vergroten?</u>
                            </strong>
                        ) : (
                            <strong>
                                Geef uw <u>plaatsvoorkeuren</u> door. Het systeem probeert u in te delen op uw favoriete
                                plaatsen.
                            </strong>
                        )}
                    </p>
                )}
            </div>
        </div>
    );
};

OndernemerMarktVoorkeuren.propTypes = {
    plaatsvoorkeuren: PropTypes.array.isRequired,
    voorkeur: PropTypes.object.isRequired,
    markt: PropTypes.object.isRequired,
    ondernemer: PropTypes.object.isRequired,
    sollicitatie: PropTypes.object.isRequired,
    query: PropTypes.string,
};

module.exports = OndernemerMarktVoorkeuren;
