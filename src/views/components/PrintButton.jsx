import PropTypes from 'prop-types';
import React from 'react';

const PrintButton = ({ title, type, disabled }) => {
    const markup = ( _title, _type, _disabled ) => {
        return { __html: '<button ' + (_disabled ? 'disabled="disabled"' : '') + ' type="' + (_type ? _type : 'button') + '" class="PrintButton__btn" href="#" onclick="window.print();">' + _title + '</button>' };
    };

    return (
        <div className="PrintButton" dangerouslySetInnerHTML={markup(title, type, disabled)}/>
    );
};

PrintButton.propTypes = {
    title: PropTypes.string,
    type: PropTypes.string,
    disabled: PropTypes.bool
};

module.exports = PrintButton;
