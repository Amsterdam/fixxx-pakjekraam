const React = require('react');
const PropTypes = require('prop-types');
const { formatOndernemerName } = require('../../domain-knowledge.js');
const { today } = require('../../util.js');
const Button = require('./Button');

class OndernemerProfile extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
    };

    render() {
        const { ondernemer } = this.props;

        return (
            <div>
                <h1>Ondernemer detail: {formatOndernemerName(ondernemer)}</h1>
                <p>{ondernemer.erkenningsnummer}</p>
                <Button
                    href={`/dashboard/${ondernemer.erkenningsnummer}`}
                    type="secondary"
                    label="Ondernemer dashboard"
                />
                <h2>Markten</h2>
                <ul>
                    {ondernemer.sollicitaties
                        .filter(sollicitatie => !sollicitatie.doorgehaald)
                        .map(sollicitatie => (
                            <li key={sollicitatie.markt.id}>
                                <span>
                                    <a href={`/markt/${sollicitatie.markt.id}/`}>
                                        {sollicitatie.markt.naam} {sollicitatie.status}
                                    </a>{' '}
                                    {sollicitatie.sollicitatieNummer}
                                </span>
                                <br />
                                <a
                                    href={`/afmelden/${ondernemer.erkenningsnummer}/${
                                        sollicitatie.markt.id
                                    }/?next=/profile/${ondernemer.erkenningsnummer}`}
                                >
                                    <strong>aanwezigheid</strong>
                                </a>
                                &nbsp;&nbsp;
                                <a
                                    href={`/voorkeuren/${ondernemer.erkenningsnummer}/${
                                        sollicitatie.markt.id
                                    }/?next=/profile/${ondernemer.erkenningsnummer}`}
                                >
                                    <strong>plaatsvoorkeuren</strong>
                                </a>
                                &nbsp;&nbsp;
                                <a
                                    href={`/algemene-voorkeuren/${ondernemer.erkenningsnummer}/${
                                        sollicitatie.markt.id
                                    }/?next=/profile/${ondernemer.erkenningsnummer}&advanced=true`}
                                >
                                    <strong>algemene voorkeuren</strong>
                                </a>
                            </li>
                        ))}
                </ul>
            </div>
        );
    }
}

module.exports = OndernemerProfile;
