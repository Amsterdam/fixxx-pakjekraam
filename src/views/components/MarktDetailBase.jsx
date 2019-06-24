const React = require('react');
const Page = require('./Page.jsx');
const Header = require('./Header');
const Content = require('./Content');
const PropTypes = require('prop-types');
const { formatDayOfWeek, formatMonth } = require('../../util');
const MarktDayLink = require('./MarktDayLink');
const MarktDetailHeader = require('./MarktDetailHeader');
const PrintButton = require('./PrintButton');

const MarktDetailBase = ({ children, bodyClass, title, markt, type, datum, user, showDate }) => {
    const relativeDatum = d => {
        return formatDayOfWeek(d) + ', ' + new Date(d).getDate() + ' ' + formatMonth(d);
    };

    return (
        <Page bodyClass={bodyClass}>
            <Header user={user}>
                <a className="Header__nav-item" href="/markt/">
                    Markten
                </a>
            </Header>
            <MarktDetailHeader>
                {showDate && (
                    <MarktDayLink markt={markt} offsetDate={new Date(datum).toISOString()} direction={-1} type={type} />
                )}
                <div className="MarktDetailHeader__title-wrapper">
                    <h1 className="MarktDetailHeader__title">
                        {markt.naam}
                        {title ? ': ' + title : ''}
                        {showDate && <span className="MarktDetailHeader__title-sub">{relativeDatum(datum)}</span>}
                    </h1>
                    {type && <PrintButton title={`Print ${type}`} />}
                </div>
                {showDate && (
                    <MarktDayLink markt={markt} offsetDate={new Date(datum).toISOString()} direction={1} type={type} />
                )}
            </MarktDetailHeader>
            <Content>{children}</Content>
        </Page>
    );
};

MarktDetailBase.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    bodyClass: PropTypes.string,
    markt: PropTypes.object,
    user: PropTypes.object,
    title: PropTypes.string,
    datum: PropTypes.string,
    type: PropTypes.string,
    showDate: PropTypes.bool,
};

module.exports = MarktDetailBase;
