const LoginButton = require('./LoginButton');
const PropTypes = require('prop-types');
const React = require('react');

const Header = ({ user, children, logoUrl }) => {
    return (
        <header className="Header">
            <div className="Header__top">
                <div className="container">
                    <div className="container__content">
                        <div className="Header__top-container">
                            <a className="Header__logo-link" href={`${logoUrl ? logoUrl : `/`}`}>
                                <picture className="Header__logo">
                                    <source srcSet="/images/logo-desktop.svg" media="(min-width: 540px)" />
                                    <source srcSet="/images/logo-mobile.svg" media="(min-width: 0)" />
                                    <img srcSet="/images/logo-desktop.svg" alt="…" />
                                </picture>
                            </a>
                            <h1 className="Header__heading">Kies je kraam</h1>
                            <div>
                                <LoginButton user={user} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="Header__bottom">
                <div className="container">
                    <div className="container__content">
                        <div className="Header__bottom-container">{children}</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    user: PropTypes.object,
    logoUrl: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

module.exports = Header;
