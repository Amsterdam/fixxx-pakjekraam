const React = require('react');
import MarktDetailBase from './components/MarktDetailBase';
import OndernemerList from './components/OndernemerList';
const PropTypes = require('prop-types');

class VastplaatshoudersPage extends React.Component {
    propTypes = {
        data: PropTypes.object.isRequired,
        datum: PropTypes.string,
    };

    render() {
        const {
            aanmeldingen,
            branches,
            geografie,
            locaties,
            ondernemers,
            paginas,
            voorkeuren,
            markt,
        } = this.props.data;

        return <MarktDetailBase bodyClass="page-markt-vasteplaatshouders" title="Vasteplaatshouders" />;
    }
}

module.exports = VastplaatshoudersPage;
