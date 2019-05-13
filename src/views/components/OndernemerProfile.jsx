const React = require('react');
const PropTypes = require('prop-types');

class OndernemerProfile extends React.Component {
    propTypes = {
        user: PropTypes.object.isRequired,
        ondernemer: PropTypes.object.isRequired,
    };

    render() {
        return (
            <div>
                <h1>{this.props.user.erkenningsNummer}</h1>
                <p>Welkom, ondernemer {this.props.user.erkenningsNummer}!</p>
                <h2>Markten</h2>
                <ul>
                    {this.props.ondernemer.sollicitaties.map(sollicitatie => (
                        <li key={sollicitatie.markt.id}>{sollicitatie.markt.naam}</li>
                    ))}
                </ul>
                <p>
                    <a href="/aanmelden">Meld je nu aan voor de markt van morgen!</a>
                </p>
            </div>
        );
    }
}

module.exports = OndernemerProfile;
