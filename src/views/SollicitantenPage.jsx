const React = require('react');
import MarktDetailPage from './MarktDetailPage';
const PropTypes = require('prop-types');

class SollicitantenPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemer: PropTypes.object,
    };

    render() {
        return <MarktDetailPage />;
    }
}

module.exports = SollicitantenPage;
