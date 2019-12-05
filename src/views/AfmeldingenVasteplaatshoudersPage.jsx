const React = require('react');
const MarktDetailBase = require('./components/MarktDetailBase');
const OndernemerListAfwezig = require('./components/OndernemerListAfwezig.tsx');
const PrintPage = require('./components/PrintPage');
const PropTypes = require('prop-types');
const { arrayToChunks } = require('../util');

class afmeldingenPage extends React.Component {
    propTypes = {
        markt: PropTypes.object.isRequired,
        data: PropTypes.object,
        datum: PropTypes.string,
        vasteplaatshoudersAfgemeld: PropTypes.array,
    };

    render() {
        const {
           datum,
           markt,
           vasteplaatshoudersAfgemeld
        } = this.props;

        const columns = arrayToChunks(vasteplaatshoudersAfgemeld, 40);

        return (
            <MarktDetailBase
                bodyClass="page-markt-sollicitanten page-print"
                title="Afmeldingen vasteplaatshouders"
                markt={markt}
                datum={datum}
                buttonLabel={'afmeldingen'}
                showDate={false}
                type={'afmeldingen'}
            >
                <PrintPage
                    title={`Vasteplaatshouders afgemeld: ${markt.naam}`}
                    datum={datum}>
                    {columns.map((ondernemers, j) => (
                        <OndernemerListAfwezig
                            ondernemers={ondernemers}
                            key={j}
                        />
                    ))}
                </PrintPage>
            </MarktDetailBase>
        );
    }
}

module.exports = afmeldingenPage;
