import { formatDayOfWeek } from '../../util';
import IndelingslijstGroup from './IndelingslijstGroup';
import PropTypes from 'prop-types';
import React from 'react';
import Street from './Street';

const IndelingslijstPage = ({ page, index, data, markt, type, datum }) => {
    return (
        <div className="IndelingslijstPage indelingslijst-page">
            <div className="IndelingslijstPage__ratio" data-ratio="210:297">
                <div className="IndelingslijstPage__wrapper">
                    <span className="IndelingslijstPage__date">
                        {formatDayOfWeek(datum)}, {datum}
                    </span>
                    <h3 className="IndelingslijstPage__heading">
                        {markt.naam}
                        <span className="IndelingslijstPage__index">{index + 1}</span>
                    </h3>
                    <div className="IndelingslijstPage__list-wrapper">
                        {page.indelingslijstGroup.map((pageItem, i) => {
                            if (pageItem.type && pageItem.type === 'street') {
                                return <Street title={pageItem.title} />;
                            } else {
                                return (
                                    <IndelingslijstGroup
                                        key={i}
                                        page={pageItem}
                                        plaatsList={data.locaties}
                                        vphl={data.ondernemers}
                                        obstakelList={data.obstakels}
                                        aanmeldingen={data.aanmeldingen}
                                        markt={markt}
                                        datum={datum}
                                        type={type}
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
    markt: PropTypes.object.isRequired,
    type: PropTypes.string,
    datum: PropTypes.string,
};

module.exports = IndelingslijstPage;
