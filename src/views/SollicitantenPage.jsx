const React = require('react');
import MarktDetailBase from './components/MarktDetailBase';
import OndernemerList from './components/OndernemerList';
const PropTypes = require('prop-types');

class SollicitantenPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemers: PropTypes.object,
    };

    render() {
        return (
            <MarktDetailBase bodyClass="page-markt-sollicitanten" title="Sollicitanten">
                <OndernemerList ondernemers={this.props.ondernemers} markt={this.props.markt} />
            </MarktDetailBase>
        );
    }
}

module.exports = SollicitantenPage;
