import * as React from 'react';
const EmailBase = require('./components/EmailBase.jsx');
const EmailContent = require('./components/EmailContent.jsx');

export class EmailPage extends React.Component {
    render() {
        return (
            <EmailBase lang="nl" appName={`Kies je kraam`} domain={`kiesjekraam.amsterdam.nl`} subject={`Onderwerp`}>
                <EmailContent>
                    <h2>Email Title</h2>
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </EmailContent>
                <EmailContent>
                    <ul>
                        <li>
                            <a href="#">Link item 1</a>
                        </li>
                        <li>
                            <a href="#">Link item 2</a>
                        </li>
                        <li>
                            <a href="#">Link item 3</a>
                        </li>
                    </ul>
                </EmailContent>
            </EmailBase>
        );
    }
}

export default EmailPage;
