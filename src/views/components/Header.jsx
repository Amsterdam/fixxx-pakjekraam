import LoginButton from './LoginButton';
import PropTypes from 'prop-types';
import React from 'react';

const Header = ({ user }) => {
    return (
        <header className="Header">
            <div className="Header__top">
                <div className="container">
                    <div className="container__content">
                        <div className="Header__top-container">
                            <a className="Header__logo-link" href="/">
                                <picture className="Header__logo">
                                    <source srcSet="/images/logo-desktop.svg" media="(min-width: 540px)" />
                                    <source srcSet="/images/logo-mobile.svg" media="(min-width: 0)" />
                                    <img srcSet="/images/logo-desktop.svg" alt="…" />
                                </picture>
                            </a>
                            <h1 className="Header__heading">Pak je kraam</h1>
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
                        <div className="Header__bottom-container">
                            <a className="Header__nav-item" href="/markt/">
                                Markten
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    user: PropTypes.object,
};

module.exports = Header;
