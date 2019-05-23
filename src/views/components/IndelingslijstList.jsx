import ObstakelList from './ObstakelList';
import Plaats from './Plaats';
import PropTypes from 'prop-types';
import React from 'react';

const IndelingslijstList = ({ page, plaatsList, vphl, obstakelList, markt, aanmeldingen }) => {
    let first = true;

    return (
        <div className={'IndelingslijstList indelingslijst__list markt-' + markt.id + '__' + page.class}>
            {page.title && <h4>{page.title}</h4>}

            <table className="IndelingslijstList__table" cellPadding="0" cellSpacing="0">
                <thead className="IndelingslijstList__wrapper">
                    <tr className="IndelingslijstList__header-row">
                        <th className="IndelingslijstList__header IndelingslijstList__header-properties" />
                        <th className="IndelingslijstList__header IndelingslijstList__header-plaats">Nr.</th>
                        <th className="IndelingslijstList__header IndelingslijstList__vph">VPH</th>
                        <th className="IndelingslijstList__header IndelingslijstList__empty-field" />
                    </tr>
                </thead>
                <tbody className="IndelingslijstList__wrapper">
                    {page.plaatsList.map((plaatsNr, i) => {
                        const vasteOndernemer = vphl[plaatsNr];
                        const aanmelding =
                            vasteOndernemer &&
                            aanmeldingen.find(rsvp => rsvp.erkenningsNummer === vasteOndernemer.erkenningsNummer);

                        if (plaatsList[String(plaatsNr)]) {
                            if (obstakelList[String(plaatsNr)] && obstakelList[String(plaatsNr)].length > 0) {
                                return (
                                    <React.Fragment key={plaatsNr}>
                                        <Plaats
                                            first={first}
                                            vph={vphl[String(plaatsNr)]}
                                            plaats={plaatsList[String(plaatsNr)]}
                                            obstakels={obstakelList}
                                            aanmelding={aanmelding}
                                            markt={markt}
                                        />
                                        <ObstakelList obstakelList={obstakelList[String(plaatsNr)]} />
                                        {(first = true)}
                                    </React.Fragment>
                                );
                            } else {
                                return (
                                    <React.Fragment key={plaatsNr}>
                                        <Plaats
                                            first={first}
                                            key={plaatsNr}
                                            vph={vphl[String(plaatsNr)]}
                                            plaats={plaatsList[String(plaatsNr)]}
                                            obstakels={obstakelList}
                                            aanmelding={aanmelding}
                                            markt={markt}
                                        />
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
        </div>
    );
};

IndelingslijstList.propTypes = {
    aanmeldingen: PropTypes.array.isRequired,
    page: PropTypes.object,
    plaatsList: PropTypes.object,
    vphl: PropTypes.object,
    obstakelList: PropTypes.object,
    markt: PropTypes.object.isRequired,
};

module.exports = IndelingslijstList;
