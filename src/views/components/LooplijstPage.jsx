import PropTypes from "prop-types";
import React from 'react';
import Street from './Street';
import LooplijstList from './LooplijstList';

const LooplijstPage = ({ page, index, data }) => {
    return (
            <div className="LooplijstPage looplijst-page">
                <div className="LooplijstPage__ratio" data-ratio="210:297">
                    <div className="LooplijstPage__wrapper">
                        <h3 className="LooplijstPage__heading">TODO: MarktNaam<span className="LooplijstPage__index">{index}</span></h3>
                        <div className="LooplijstPage__list-wrapper">
                        {

                            page.looplijstList.map((pageItem, i) => {
                                //console.log(pageItem.type);
                                if (pageItem.type && pageItem.type === 'street') {
                                    return (
                                        <Street title={page.title}/>
                                    );
                                } else {
                                    return (
                                    <LooplijstList key={i}
                                                   page={pageItem}
                                                   plaatsList={data.locaties}
                                                   vphl={data.ondernemers}
                                                   obstakelList={data.obstakels}
                                    />

                                    );
                                }
                            })
                        }
                        </div>
                    </div>
                </div>
            </div>
    );
};

LooplijstPage.propTypes = {
  page: PropTypes.object,
  index: PropTypes.number,
  data: PropTypes.object
};

module.exports = LooplijstPage;
