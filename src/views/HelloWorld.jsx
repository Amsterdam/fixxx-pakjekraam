const React = require('react');
const Page = require('./Page.jsx');

class HelloWorld extends React.Component {
    render() {
        return (
            <Page>
                <div>Hello World</div>
            </Page>
        );
    }
}

module.exports = HelloWorld;
