const React = require('react');
const Page = require('./Page.jsx');
const Header = require('./Header');
const Content = require('./Content');
const PropTypes = require('prop-types');

const MarktDetailBase = ({ children, bodyClass, title }) => {
    return (
        <Page bodyClass={bodyClass}>
            <Header />
            <Content>
                {title && <h1>{title}</h1>}
                {children}
            </Content>
        </Page>
    );
};

MarktDetailBase.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    bodyClass: PropTypes.string,
    title: PropTypes.string,
};

module.exports = MarktDetailBase;
