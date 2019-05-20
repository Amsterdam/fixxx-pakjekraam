const React = require('react');
const PropTypes = require('prop-types');
const { formatOndernemerName } = require('../../util.js');

class OndernemerProfile extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
    };

    render() {
        const { ondernemer } = this.props;

        return (
            <div>
                <h1>{formatOndernemerName(ondernemer)}</h1>
                <p>{ondernemer.erkenningsnummer}</p>
                <h2>Markten</h2>
                <ul>
                    {ondernemer.sollicitaties
                        .filter(sollicitatie => !sollicitatie.doorgehaald)
                        .map(sollicitatie => (
                            <li key={sollicitatie.markt.id}>
                                {sollicitatie.markt.naam} {sollicitatie.sollicitatieNummer} {sollicitatie.status}
                            </li>
                        ))}
                </ul>
            </div>
        );
    }
}

module.exports = OndernemerProfile;
