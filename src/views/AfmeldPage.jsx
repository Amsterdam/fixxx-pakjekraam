const React = require('react');
const Page = require('./components/Page.jsx');
const AfmeldForm = require('./components/AfmeldForm.jsx');

class AfmeldPage extends React.Component {
    render() {
        return (
            <Page>
                <AfmeldForm />
            </Page>
        );
    }
}

module.exports = AfmeldPage;
