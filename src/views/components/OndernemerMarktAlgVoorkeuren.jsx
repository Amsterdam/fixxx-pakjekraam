const Button = require('./Button');
const HeaderTitleButton = require('./HeaderTitleButton');
const PropTypes = require('prop-types');
const React = require('react');
const { formatDayOfWeek, formatDate, WEEK_DAYS } = require('../../util.js');

const OndernemerMarktAlgVoorkeuren = ({ markt, sollicitatie, ondernemer, voorkeur }) => {
    const blockUrl = `/algemene-voorkeuren/${ondernemer.erkenningsnummer}/${markt.id}/?next=/markt-detail/${
        ondernemer.erkenningsnummer
    }/${markt.id}/#marktprofiel`;

    return (
        <div className="OndernemerMarktAlgVoorkeuren background-link-parent" id="marktprofiel">
            <a href={blockUrl} className="background-link" />
            <HeaderTitleButton title="Marktprofiel" url={blockUrl} />
            <div className="well">
                {voorkeur ? (
                    <dl>
                        <dt>Branche</dt>
                        <dd>{voorkeur.brancheId ? voorkeur.brancheId : 'geen'}</dd>
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
