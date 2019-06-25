const PropTypes = require('prop-types');
const React = require('react');
const Button = require('./Button');

const HeaderTitleButton = ({ title, url, label }) => {
    return (
        <div className="HeaderTitleButton">
            <h3>{title}</h3>
            <Button label={label || 'Wijzig'} href={url} type={`secondary`} />
        </div>
    );
};

HeaderTitleButton.propTypes = {
    title: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    label: PropTypes.string,
};

module.exports = HeaderTitleButton;
