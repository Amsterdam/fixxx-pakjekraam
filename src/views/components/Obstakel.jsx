import PropTypes from "prop-types";
import React from 'react';

const icons = ['loopjediedichtmag', 'lantaarnpaal', 'bankje', 'boom', 'electra'];

const Obstakel = ({ obstakel }) => {
    return (
        <span className={'Obstakel ' + (icons.includes(obstakel) ? 'Obstakel__icon icon-' + obstakel : ' Obstakel__street' )}>
                <span className="Obstakel__text">
            {(obstakel === 'loopje') ? '' : obstakel}
            </span>
        </span>
    );
};

Obstakel.propTypes = {
  obstakel: PropTypes.string
};

module.exports = Obstakel;
