import PropTypes from "prop-types";
import React from 'react';
import Plaats from './Plaats';
import ObstakelList from './ObstakelList';


const LooplijstList = ({ page, plaatsList, vphl, obstakelList, markt }) => {
    return (
            <div className={'LooplijstList looplijst__list ' + markt + '__' + page.class}>
                <h4>{page.title}</h4>

                <table cellPadding="0" cellSpacing="0">
                    <thead className="LooplijstList__wrapper">
                    <tr className="LooplijstList__header-row">
                        <th className="LooplijstList__header LooplijstList__header-properties"></th>
                        <th className="LooplijstList__header LooplijstList__header-plaats">Nr.</th>
                        <th className="LooplijstList__header LooplijstList__vph">VPH</th>
                        <th className="LooplijstList__header LooplijstList__empty-field"></th>
                    </tr>
                    </thead>
                    <tbody className="LooplijstList__wrapper">
                    {
                        page.plaatsList.map((plaatsNr,  i) => {
                            if (obstakelList[plaatsNr] && obstakelList[plaatsNr].length > 0) {
                                return (
                                    <React.Fragment key={i}>
                                    <Plaats vph={vphl[String(plaatsNr)]}
                                            plaats={plaatsList[plaatsNr]}
                                            obstakels={obstakelList}
                                    />
                                        <ObstakelList obstakelList={obstakelList[plaatsNr]}/>
                                    </React.Fragment>
                                );
                            } else {
                                return (
                                    <Plaats key={i}
                                            vph={vphl[String(plaatsNr)]}
                                            plaats={plaatsList[plaatsNr]}
                                            obstakels={obstakelList}
                                    />
                                );
                            }
                        })

                    }
                    </tbody>
                </table>
            </div>
    );
}

LooplijstList.propTypes = {
  page: PropTypes.object,
  plaatsList: PropTypes.object,
  vphl: PropTypes.object,
  obstakelList: PropTypes.object,
  markt: PropTypes.string,
};

module.exports = LooplijstList;
