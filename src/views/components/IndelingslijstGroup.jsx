const ObstakelList = require('./ObstakelList');
const Plaats = require('./Plaats.tsx').default;
const PlaatsVPH = require('./PlaatsVPH');
const PropTypes = require('prop-types');
const React = require('react');

const IndelingslijstGroup = ({
    page,
    plaatsList,
    vphl,
    obstakelList,
    markt,
    ondernemers,
    aanmeldingen,
    toewijzingen,
    type,
    datum,
}) => {
    let first = true;
    const renderPlaats = props => {
        return type === 'vasteplaatshouders' ? <PlaatsVPH {...props} /> : <Plaats {...props} />;
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
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__header-properties Plaats__prop Plaats__prop-properties" />
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__header-plaats Plaats__prop Plaats__prop-plaats-nr">
                            nr.
                        </th>
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__vph Plaats__prop Plaats__prop-vph">
                            vph
                        </th>
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__vph Plaats__prop Plaats__prop-naam" />
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__empty-field Plaats__prop Plaats__prop-vph" />
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__empty-field Plaats__prop Plaats__prop-naam" />
                        <th className="IndelingslijstGroup__header IndelingslijstGroup__status Plaats__prop Plaats__prop-status" />
                    </tr>
                </thead>
                <tbody className="IndelingslijstGroup__wrapper">
                    {page.plaatsList.map((plaatsNr, i) => {
                        const vasteOndernemer = vphl[plaatsNr];

                        const aanmelding =
                            vasteOndernemer &&
                            aanmeldingen.find(rsvp => rsvp.erkenningsNummer === vasteOndernemer.erkenningsNummer);

                        const toewijzing = (toewijzingen || []).find(({ plaatsen }) => plaatsen.includes(plaatsNr));

                        const plaatsProps = {
                            first,
                            key: plaatsNr,
                            vph: vphl[plaatsNr],
                            plaats: plaatsList[plaatsNr],
                            obstakels: obstakelList,
                            ondernemer: toewijzing
                                ? ondernemers.find(
                                      ({ erkenningsNummer }) => erkenningsNummer === toewijzing.erkenningsNummer,
                                  )
                                : null,
                            aanmelding,
                            markt,
                            datum,
                            type,
                            toewijzing,
                        };

                        if (plaatsList[plaatsNr]) {
                            if (obstakelList[plaatsNr] && obstakelList[plaatsNr].length > 0) {
                                return (
                                    <React.Fragment key={plaatsNr}>
                                        {renderPlaats(plaatsProps)}
                                        <ObstakelList obstakelList={obstakelList[plaatsNr]} />
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
    toewijzingen: PropTypes.array,
    page: PropTypes.object,
    plaatsList: PropTypes.object,
    vphl: PropTypes.object,
    obstakelList: PropTypes.object,
    ondernemers: PropTypes.array.isRequired,
    markt: PropTypes.object.isRequired,
    type: PropTypes.string,
    datum: PropTypes.string,
};

module.exports = IndelingslijstGroup;
