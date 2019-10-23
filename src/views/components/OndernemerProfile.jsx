const React = require('react');
const PropTypes = require('prop-types');
const { formatOndernemerName } = require('../../domain-knowledge.js');
const { today } = require('../../util.ts');
const Button = require('./Button');

class OndernemerProfile extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
    };

    render() {
        const { ondernemer } = this.props;
        const vendorURL = `/ondernemer/${ondernemer.erkenningsnummer}/`;

        return (
            <div>
                <h1>Ondernemer detail: {formatOndernemerName(ondernemer)}</h1>
                <p>{ondernemer.erkenningsnummer}</p>
                <h2>Markten</h2>
                {ondernemer.sollicitaties
                    .filter(sollicitatie => !sollicitatie.doorgehaald)
                    .map(sollicitatie => (
                        <div key={sollicitatie.markt.id} className="LinkSummary">
                            <span>
                                <a className="Link" href={`/markt/${sollicitatie.markt.id}/`}><strong>{sollicitatie.markt.naam}</strong></a>&nbsp;({sollicitatie.status} {sollicitatie.sollicitatieNummer})
                            </span>
                            <div className="LinkSummary__links">
                                <a className="LinkSummary__first-link LinkInline" href={`${vendorURL}afmelden/${sollicitatie.markt.id}/`}>aanwezigheid</a>
                                <a className="LinkInline" href={`${vendorURL}voorkeuren/${sollicitatie.markt.id}/`}>plaatsvoorkeuren</a>
                                <a className="LinkInline" href={`${vendorURL}algemene-voorkeuren/${sollicitatie.markt.id}/`}>algemene voorkeuren</a>
                            </div>
                        </div>
                    ))}
            </div>
        );
    }
}

module.exports = OndernemerProfile;
