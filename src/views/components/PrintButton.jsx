import PropTypes from 'prop-types';
import React from 'react';

const PrintButton = ({ title, type, disabled }) => {
    /* eslint-disable no-script-url */
    return (
        <div className="PrintButton">
            <a href="javascript:print()" role="button" className="PrintButton__btn">
                {title}
            </a>
        </div>
    );
};

PrintButton.propTypes = {
    title: PropTypes.string,
    type: PropTypes.string,
    disabled: PropTypes.bool,
};

module.exports = PrintButton;
