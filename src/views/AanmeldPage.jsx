const React = require('react');
const Page = require('./components/Page.jsx');
const AanmeldForm = require('./components/AanmeldForm.jsx');

class AanmeldPage extends React.Component {
    render() {
        return (
            <Page>
                <AanmeldForm />
            </Page>
        );
    }
}

module.exports = AanmeldPage;
