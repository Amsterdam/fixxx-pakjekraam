const React = require('react');
const PropTypes = require('prop-types');
const MarktDetailBase = require('./components/MarktDetailBase');
const today = () => new Date().toISOString().replace(/T.+/, '');

class MarktDetailPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
    };

    render() {
        return (
            <MarktDetailBase bodyClass="page-markt-detail">
                <div className="row">
                    <div className="col-1-2">
                        <h2>Indelingslijsten</h2>
                        <ul>
                            <li>
                                <a
                                    href={`/markt-indeling/${this.props.markt.id}/${today()}/indelingslijst/`}
                                    className=""
                                >
                                    Vandaag
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="col-1-2">
                        <h2>Ondernemers</h2>
                        <ul>
                            <li>
                                <a href="#" className="">
                                    Vasteplaatshouder
                                </a>
                            </li>
                            <li>
                                <a
                                    href={`/markt-indeling/${this.props.markt.id}/${today()}/indelingslijst/`}
                                    className=""
                                >
                                    Sollicitanten
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </MarktDetailBase>
        );
    }
}

module.exports = MarktDetailPage;
