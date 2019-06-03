import ProfilePhoto from './ProfilePhoto';
import PropTypes from 'prop-types';
import React from 'react';

const OndernemerProfileHeader = ({ user }) => {
    return (
        <header className="OndernemerProfileHeader">
            <ProfilePhoto imageUrlSet={['/todo/']} />
            <div>
                <span>{user.naam}</span>
            </div>
        </header>
    );
};

OndernemerProfileHeader.propTypes = {
    user: PropTypes.object.isRequired,
};

module.exports = OndernemerProfileHeader;
