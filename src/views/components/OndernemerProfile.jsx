const React = require('react');
const PropTypes = require('prop-types');
const { formatOndernemerName } = require('../../domain-knowledge.js');

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
                                <span>
                                    {sollicitatie.markt.naam} {sollicitatie.sollicitatieNummer} {sollicitatie.status}
                                </span>
                                <br />
                                <a
                                    href={`/afmelden/${ondernemer.erkenningsnummer}/${
                                        sollicitatie.markt.id
                                    }/?next=/profile/${ondernemer.erkenningsnummer}`}
                                >
                                    <strong>aanweizigheid</strong>
                                </a>
                                &nbsp;&nbsp;
                                <a
                                    href={`/voorkeuren/${ondernemer.erkenningsnummer}/${
                                        sollicitatie.markt.id
                                    }/?next=/profile/${ondernemer.erkenningsnummer}`}
                                >
                                    <strong>voorkeuren</strong>
                                </a>
                            </li>
                        ))}
                </ul>
            </div>
        );
    }
}

module.exports = OndernemerProfile;
