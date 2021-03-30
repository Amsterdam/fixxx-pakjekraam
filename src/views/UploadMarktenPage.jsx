const Content = require('./components/Content');
const Header = require('./components/Header');
const Page = require('./components/Page.jsx');
const PropTypes = require('prop-types');
const React = require('react');
const Alert = require('./components/Alert');
const moment = require('moment');
const { getBreadcrumbsOndernemer } = require('../util');

class UploadMarktenPage extends React.Component {
    propTypes = {
        user: PropTypes.object.isRequired,
        role: PropTypes.string.isRequired,
        configName: PropTypes.string,
        succesMessage: PropTypes.string,
        errorMessage: PropTypes.string,
    };

    render() {
        const {
            user,
            role,
            configName,
            succesMessage,
            errorMessage
        } = this.props;

        return (
            <Page messages={this.props.messages}>
                <Header user={user} role={role}>
                </Header>
                <Content>
                    <h1 className="Heading Heading--intro">Uploaden markten</h1>

                    <div style={{ backgroundColor: '#E6E6E6', marginBottom: 20, padding: '15px 10px' }}>Meest recente upload: <b>{configName}</b></div>

                    <form className="Form Form--UploadMarktConfigForm" action="/upload-markten/zip/" method="post" encType="multipart/form-data">
                        <input type="file" id="marktenZip" accept=".zip" name="marktenZip" required/>
                        <input className="Button Button--secondary Form Form__element" type="submit" />
                    </form>
                    {succesMessage ? (
                        <Alert type="success" inline={true} >
                            { succesMessage }
                        </Alert>
                    ) : null }
                    { errorMessage ? (
                        <Alert type="error" inline={true}>
                            <span>{ errorMessage }</span>
                        </Alert>
                    ) : null }
                </Content>
            </Page>
        );
    }
}

module.exports = UploadMarktenPage;
