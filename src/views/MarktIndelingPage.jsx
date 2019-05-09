const React = require('react');
const Page = require('./components/Page.jsx');
const LoginForm = require('./components/LoginForm.jsx');

class MarktIndelingPage extends React.Component {
    render() {
        return (
            <Page>
                <h1>Looplijst</h1>
                <script src="/script/controller.js" />
                <script src="/script/view.js" />
                <script src="/script/index.js" />
                <link rel="stylesheet" type="text/css" href="/style/looplijst.css" />
            </Page>
        );
    }
}

module.exports = MarktIndelingPage;
