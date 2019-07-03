const Button = require('./Button');
const HeaderTitleButton = require('./HeaderTitleButton');
const PropTypes = require('prop-types');
const React = require('react');
const { formatDayOfWeek, formatDate, WEEK_DAYS } = require('../../util.js');

const OndernemerMarktAlgVoorkeuren = ({ markt, sollicitatie, ondernemer, voorkeur }) => {
    return (
        <div className="OndernemerMarktAlgVoorkeuren background-link-parent">
            <a
                href={`/algemene-voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/?next=/markt-detail/${
                    ondernemer.erkenningsnummer
                }/${markt.id}/`}
                className="background-link"
            />
            <HeaderTitleButton
                title="Marktprofiel"
                url={`/algemene-voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/?next=/markt-detail/${
                    ondernemer.erkenningsnummer
                }/${markt.id}/`}
            />
            <div className="well">
                {voorkeur ? (
                    <dl>
                        <dt>Branche</dt>
                        <dd>{voorkeur.branches ? voorkeur.branches : 'geen'}</dd>
                        <dt>Bakplaats</dt>
                        <dd>{voorkeur.parentBrancheId ? voorkeur.parentBrancheId : 'geen'}</dd>
                        <dt>Eigen materiaal</dt>
                        <dd>{voorkeur.inrichting ? voorkeur.inrichting : 'geen'}</dd>
                    </dl>
                ) : (
                    <p>
                        <strong>Je hebt nog geen marktprofiel ingesteld.</strong>
                    </p>
                )}
                <span>
                    Bij het indienen houden we rekening met voorrang op brancheplaatsen, bakplaatsen en eigen materiaal
                    plaatsen
                </span>
            </div>
        </div>
    );
};

OndernemerMarktAlgVoorkeuren.propTypes = {
    markt: PropTypes.object.isRequired,
    sollicitatie: PropTypes.object.isRequired,
    ondernemer: PropTypes.object.isRequired,
    voorkeur: PropTypes.object,
};

module.exports = OndernemerMarktAlgVoorkeuren;
