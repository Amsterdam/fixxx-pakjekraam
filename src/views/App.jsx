import Content from './component/Content';
const React = require('react');
const Page = require('./Page.jsx');

class App extends React.Component {
    render() {
        return (
            <Page>
                <Content />
            </Page>
        );
    }
}

module.exports = App;
