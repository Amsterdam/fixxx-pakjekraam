const ObstakelList = require('./ObstakelList');
const Plaats = require('./Plaats');
const PlaatsVPH = require('./PlaatsVPH');
const PropTypes = require('prop-types');
const React = require('react');

const IndelingslijstGroup = ({ page, plaatsList, vphl, obstakelList, markt, aanmeldingen, type, datum }) => {
    let first = true;
    const renderPlaats = props => {
        return !type || type === 'indelingslijst' ? <Plaats {...props} /> : <PlaatsVPH {...props} />;
    };
    const classes = page.class.split(' ').map(cl => {
        return 'IndelingslijstGroup--markt-' + markt.id + ' IndelingslijstGroup--' + cl.trim();
    });

    return (
        <div className={'IndelingslijstGroup ' + classes}>
            <h4 className="IndelingslijstGroup__title">{page.title}</h4>
            {page.landmarkTop && (
                <p className="IndelingslijstGroup__landmark IndelingslijstGroup__landmark-top">{page.landmarkTop}</p>
            )}

            <table className="IndelingslijstGroup__table" cellPadding="0" cellSpacing="0">
                <thead className="IndelingslijstGroup__wrapper">
                    <tr className="IndelingslijstGroup__header-row">
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__header-properties" />
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__header-plaats">nr.</th>
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__vph">vph</th>
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__empty-field" />
                    </tr>
                </thead>
                <tbody className="IndelingslijstGroup__wrapper">
                    {page.plaatsList.map((plaatsNr, i) => {
                        const vasteOndernemer = vphl[plaatsNr];

                        const aanmelding =
                            vasteOndernemer &&
                            aanmeldingen.find(rsvp => rsvp.erkenningsNummer === vasteOndernemer.erkenningsNummer);

                        const plaatsProps = {
                            first,
                            key: plaatsNr,
                            vph: vphl[String(plaatsNr)],
                            plaats: plaatsList[String(plaatsNr)],
                            obstakels: obstakelList,
                            aanmelding,
                            markt,
                            datum,
                            type,
                        };

                        if (plaatsList[String(plaatsNr)]) {
                            if (obstakelList[String(plaatsNr)] && obstakelList[String(plaatsNr)].length > 0) {
                                return (
                                    <React.Fragment key={plaatsNr}>
                                        {renderPlaats(plaatsProps)}
                                        <ObstakelList obstakelList={obstakelList[String(plaatsNr)]} />
                                        {(first = true)}
                                    </React.Fragment>
                                );
                            } else {
                                return (
                                    <React.Fragment key={plaatsNr}>
                                        {renderPlaats(plaatsProps)}
                                        {(first = false)}
                                    </React.Fragment>
                                );
                            }
                        } else {
                            return <Plaats key={i} />;
                        }
                    })}
                </tbody>
            </table>
            {page.landmarkBottom && (
                <p className="IndelingslijstGroup__landmark IndelingslijstGroup__landmark-bottom">
                    {page.landmarkBottom}
                </p>
            )}
        </div>
    );
};

IndelingslijstGroup.propTypes = {
    aanmeldingen: PropTypes.array.isRequired,
    page: PropTypes.object,
    plaatsList: PropTypes.object,
    vphl: PropTypes.object,
    obstakelList: PropTypes.object,
    markt: PropTypes.object.isRequired,
    type: PropTypes.oneOf(['vph', 'indeling']),
    datum: PropTypes.string,
};

module.exports = IndelingslijstGroup;
