const PropTypes = require('prop-types');
const React = require('react');
const { paginate } = require('../../util.js');
const Button = require('./Button');
const HeaderTitleButton = require('./HeaderTitleButton');

const OndernemerMarktVoorkeuren = ({ plaatsvoorkeuren, markt, ondernemer, query, sollicitatie }) => {
    const blockUrl = `../../voorkeuren/${markt.id}/?next=../../markt-detail/${markt.id}/#plaatsvoorkeuren`;
    const entriesFiltered = plaatsvoorkeuren.filter(entry => entry.marktId === markt.id);
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
                {sollicitatie.status === 'vpl' ? (
                    <div className="margin-bottom">
                        <strong className="h4">{sollicitatie.vastePlaatsen.join(' & ')}</strong>{' '}
                        <span className="font-gray">
                            (vaste plaats{sollicitatie.vastePlaatsen.length > 1 ? 'en' : null})
                        </span>
                    </div>
                ) : null}
                {entriesSplit.length ? (
                    <div className="margin-top" key="voorkeuren">
                        <strong>Dit zijn je plaatsvoorkeuren</strong>
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
    sollicitatie: PropTypes.object.isRequired,
    query: PropTypes.string,
};

module.exports = OndernemerMarktVoorkeuren;
