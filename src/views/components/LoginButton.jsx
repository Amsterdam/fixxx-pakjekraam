const PropTypes = require('prop-types');
const React = require('react');

const LoginButton = ({ user }) => {
    return (
        <a className={`LoginButton LoginButton--logout`} href={`/logout`} role="button">
            Uitloggen
        </a>
    );
};

LoginButton.propTypes = {
    user: PropTypes.object,
};

module.exports = LoginButton;
