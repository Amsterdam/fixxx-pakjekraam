import PropTypes from 'prop-types';
import React from 'react';

const LoginButton = ({ user }) => {
    return <a role="button">Login</a>;
};

LoginButton.propTypes = {
    user: PropTypes.object.isRequired,
};

module.exports = LoginButton;
