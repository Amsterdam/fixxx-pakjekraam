import IndelingslijstList from './IndelingslijstList';
import PropTypes from 'prop-types';
import React from 'react';
import Street from './Street';

const IndelingslijstPage = ({ page, index, data, markt }) => {
    return (
        <div className="IndelingslijstPage indelingslijst-page">
            <div className="IndelingslijstPage__ratio" data-ratio="210:297">
                <div className="IndelingslijstPage__wrapper">
                    <h3 className="IndelingslijstPage__heading">
                        {markt.slug}
                        <span className="IndelingslijstPage__index">{index + 1}</span>
                    </h3>
                    <div className="IndelingslijstPage__list-wrapper">
                        {page.indelingslijstList.map((pageItem, i) => {
                            if (pageItem.type && pageItem.type === 'street') {
                                return <Street title={pageItem.title} />;
                            } else {
                                return (
                                    <IndelingslijstList
                                        key={i}
                                        page={pageItem}
                                        plaatsList={data.locaties}
                                        vphl={data.ondernemers}
                                        obstakelList={data.obstakels}
                                    />
                                );
                            }
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

IndelingslijstPage.propTypes = {
    page: PropTypes.object,
    index: PropTypes.number,
    data: PropTypes.object,
    markt: PropTypes.object,
};

module.exports = IndelingslijstPage;
