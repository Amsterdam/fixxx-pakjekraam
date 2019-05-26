const React = require('react');
import MarktDetailBase from './components/MarktDetailBase';
import OndernemerList from './components/OndernemerList';
const PropTypes = require('prop-types');

class SollicitantenPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        ondernemers: PropTypes.object,
        datum: PropTypes.string,
        type: PropTypes.string,
    };

    render() {
        return (
            <MarktDetailBase bodyClass="page-markt-sollicitanten" title="Sollicitanten">
                <OndernemerList
                    ondernemers={this.props.ondernemers}
                    markt={this.props.markt}
                    type={type}
                    datum={datum}
                />
            </MarktDetailBase>
        );
    }
}

module.exports = SollicitantenPage;
