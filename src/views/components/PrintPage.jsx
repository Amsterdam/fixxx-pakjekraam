import PrintPageHeader from './PrintPageHeader';
import PropTypes from 'prop-types';
import React from 'react';

const PrintPage = ({ children, index, title, label }) => {
    return (
        <div className="PrintPage">
            <div className="PrintPage__ratio" data-ratio="210:297">
                <div className="PrintPage__wrapper">
                    <PrintPageHeader>
                        <h3 className="PrintPage__heading">
                            {title}
                            {label ? (
                                <span className="PrintPage__label">Markt {index + 1}</span>
                            ) : (
                                <span className="PrintPage__index">{index + 1}</span>
                            )}
                        </h3>
                    </PrintPageHeader>
                    <div className="PrintPage__list-wrapper">{children}</div>
                </div>
            </div>
        </div>
    );
};

PrintPage.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    index: PropTypes.number,
    title: PropTypes.string,
    label: PropTypes.string,
};

module.exports = PrintPage;
