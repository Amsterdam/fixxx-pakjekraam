import React from 'react';
import logo from '../public/images/logo.svg';
import '../scss/component/Header.scss';
import '../scss/grid/container.scss';
import {Link, NavLink} from "react-router-dom";

function Header() {
    return (
        <header className="Header">

            <div className="Header__top">
                <div className="container">
                    <div className="container__content">
                    <div className="Header__top-container">
                        <img className="Header__logo" src={logo}/>
                        <h1 className="Header__heading">Pak je kraam</h1>
                    </div>
                    </div>
                </div>
            </div>
            <div className="Header__bottom">
                <div className="container">
                    <div className="container__content">
                        <div className="Header__bottom-container">
                            <NavLink className="Header__nav-item" to="/markten">Markten</NavLink>
                        </div>
                    </div>
                </div>
            </div>

        </header>
    );
}


export default Header;
