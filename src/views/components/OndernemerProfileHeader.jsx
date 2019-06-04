import ProfilePhoto from './ProfilePhoto';
import PropTypes from 'prop-types';
import React from 'react';

const OndernemerProfileHeader = ({ user }) => {
    return (
        <header className="OndernemerProfileHeader">
            <div className="OndernemerProfileHeader__profile-photo">
                <ProfilePhoto imageUrlSet={[user.fotoUrl, user.fotoMediumUrl]} />
            </div>
            <div className="OndernemerProfileHeader__text-wrapper">
                <strong className="OndernemerProfileHeader__name">
                    {user.voorletters && user.voorletters + ' '}
                    {user.achternaam}
                </strong>
            </div>
        </header>
    );
};

OndernemerProfileHeader.propTypes = {
    user: PropTypes.object.isRequired,
};

module.exports = OndernemerProfileHeader;
