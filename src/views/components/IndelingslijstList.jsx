import ObstakelList from './ObstakelList';
import Plaats from './Plaats';
import PropTypes from 'prop-types';
import React from 'react';

const IndelingslijstList = ({ page, plaatsList, vphl, obstakelList, markt }) => {
    return (
        <div className={'IndelingslijstList indelingslijst__list ' + markt + '__' + page.class}>
            <h4>{page.title}</h4>

            <table cellPadding="0" cellSpacing="0">
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
                        if (plaatsList[String(plaatsNr)]) {
                            console.log('found: ' + plaatsNr);
                            if (obstakelList[String(plaatsNr)] && obstakelList[String(plaatsNr)].length > 0) {
                                return (
                                    <React.Fragment key={i}>
                                        <Plaats
                                            vph={vphl[String(plaatsNr)]}
                                            plaats={plaatsList[String(plaatsNr)]}
                                            obstakels={obstakelList}
                                        />
                                        <ObstakelList obstakelList={obstakelList[String(plaatsNr)]} />
                                    </React.Fragment>
                                );
                            } else {
                                return (
                                    <Plaats
                                        key={i}
                                        vph={vphl[String(plaatsNr)]}
                                        plaats={plaatsList[String(plaatsNr)]}
                                        obstakels={obstakelList}
                                    />
                                );
                            }
                        } else {
                            console.log('not found: ' + plaatsNr);

                            return <Plaats key={i} />;
                        }
                    })}
                </tbody>
            </table>
        </div>
    );
};

IndelingslijstList.propTypes = {
    page: PropTypes.object,
    plaatsList: PropTypes.object,
    vphl: PropTypes.object,
    obstakelList: PropTypes.object,
    markt: PropTypes.string,
};

module.exports = IndelingslijstList;
