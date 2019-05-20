import React from 'react';

const Header = () => {
    return (
        <header className="Header">
            <div className="Header__top">
                <div className="container">
                    <div className="container__content">
                        <div className="Header__top-container">
                            <a className="Header__logo-link" href="/">
                                <img className="Header__logo" src="/images/logo.svg" />
                            </a>
                            <h1 className="Header__heading">Pak je kraam</h1>
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

module.exports = Header;
