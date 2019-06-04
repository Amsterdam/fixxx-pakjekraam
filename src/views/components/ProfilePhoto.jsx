const PropTypes = require('prop-types');
const React = require('react');

const ProfilePhoto = ({ imageUrlSet }) => {
    const mediaQueries = ['(max-width: 539px)', '(min-width: 540px)'];

    return (
        <picture className="ProfilePhoto">
            {imageUrlSet.map((url, i) => (
                <source key={i} srcSet={url} media={mediaQueries[i]} />
            ))}
            <img srcSet={imageUrlSet[0]} alt="…" />
        </picture>
    );
};

ProfilePhoto.propTypes = {
    imageUrlSet: PropTypes.arrayOf(PropTypes.string).isRequired,
};

module.exports = ProfilePhoto;
