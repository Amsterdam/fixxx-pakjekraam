import PropTypes from "prop-types";
import React from 'react';
import Street from './Street';
import LooplijstList from './LooplijstList';

const LooplijstPage = ({ page, index, data, markt }) => {
    return (
            <div className="LooplijstPage looplijst-page">
                <div className="LooplijstPage__ratio" data-ratio="210:297">
                    <div className="LooplijstPage__wrapper">
                        <h3 className="LooplijstPage__heading">{markt.slug}<span className="LooplijstPage__index">{index + 1}</span></h3>
                        <div className="LooplijstPage__list-wrapper">
                        {

                            page.looplijstList.map((pageItem, i) => {
                                if (pageItem.type && pageItem.type === 'street') {
                                    return (
                                        <Street title={pageItem.title}/>
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
  data: PropTypes.object,
  markt: PropTypes.object
};

module.exports = LooplijstPage;
