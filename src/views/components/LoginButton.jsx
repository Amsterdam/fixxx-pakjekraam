import PropTypes from 'prop-types';
import React from 'react';

const LoginButton = ({ user }) => {
    return (
        <a className="LoginButton" href={`${!user ? '/logout/' : '/login/'}`} role="button">
            {user ? 'Uitloggen' : 'Inloggen'}
        </a>
    );
};

LoginButton.propTypes = {
    user: PropTypes.object,
};

module.exports = LoginButton;
