import PrintPageHeader from './PrintPageHeader';
import PropTypes from 'prop-types';
import React from 'react';

const PrintPage = ({ children, index, title }) => {
    return (
        <div className="PrintPage">
            <div className="PrintPage__ratio" data-ratio="210:297">
                <div className="PrintPage__wrapper">
                    <PrintPageHeader>
                        <h3 className="PrintPage__heading">
                            {title}
                            <span className="IndelingslijstPage__index">{index + 1}</span>
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
};

module.exports = PrintPage;
