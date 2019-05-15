import PropTypes from 'prop-types';
import React from 'react';

const Content = ({ children }) => {
    return (
        <main className="content container">
            <div className="container__content">{children}</div>
        </main>
    );
};

Content.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

module.exports = Content;
