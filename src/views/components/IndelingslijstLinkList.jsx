import PropTypes from 'prop-types';
import React from 'react';
const today = () => new Date().toISOString().replace(/T.+/, '');

const IndelingslijstLinkList = ({ markt, ondernemer }) => {
    return (
        <div>
            <ul className="LinkList" />
        </div>
    );
};

IndelingslijstLinkList.propTypes = {
    markt: PropTypes.object.isRequired,
    ondernemer: PropTypes.object,
};

module.exports = IndelingslijstLinkList;
