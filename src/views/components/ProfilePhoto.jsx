import PropTypes from 'prop-types';
import React from 'react';

const ProfilePhoto = ({ imageUrlSet }) => {
    return (
        <picture className="ProfilePhoto">
            <img src={imageUrlSet[0]} />
        </picture>
    );
};

ProfilePhoto.propTypes = {
    imageUrlSet: PropTypes.arrayOf(PropTypes.string).isRequired,
};

module.exports = ProfilePhoto;
