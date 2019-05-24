const React = require('react');
const Page = require('./Page.jsx');
const Header = require('./Header');
const Content = require('./Content');
const PropTypes = require('prop-types');

const MarktDetailBase = ({ children, bodyClass }) => {
    return (
        <Page bodyClass={bodyClass}>
            <Header />
            <Content>{children}</Content>
        </Page>
    );
};

MarktDetailBase.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    bodyClass: PropTypes.string,
};

module.exports = MarktDetailBase;
