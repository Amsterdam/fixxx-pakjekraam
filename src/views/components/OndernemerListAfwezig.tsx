import PropTypes from 'prop-types';
import * as React from 'react';
import { IMarkt, IMarktondernemer, IRSVP } from '../../markt.model';

const OndernemerList = ({
    ondernemers,
    markt,
    aanmeldingen,
    plaatsvoorkeuren,
    algemenevoorkeuren,
}: {
    ondernemers: IMarktondernemer[];
    markt: IMarkt;
    aanmeldingen: IRSVP[];
    plaatsvoorkeuren: any;
    algemenevoorkeuren: any;
}) => (
    <div className="OndernemerList">
        <span className="OndernemerList__heading">Personen</span>
        <table className="OndernemerList__table">
            <tbody>
                {ondernemers.map(ondernemer => {
                    return (
                        // <h1>{ondernemer.erkenningsNummer}</h1>
                        <tr key={ondernemer.erkenningsNummer} className={ondernemer.status}>
                            <td>
                                <span id={`soll-${ondernemer.sollicitatieNummer}`} />
                                <a href={`/profile/${ondernemer.erkenningsNummer}`}>{ondernemer.sollicitatieNummer}</a>
                            </td>
                            <td>{ondernemer.status}</td>
                            <td>{ondernemer.description}</td>
                            <td> <strong>({ondernemer.plaatsen.join(',')})</strong></td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

OndernemerList.propTypes = {
    ondernemers: PropTypes.arrayOf(PropTypes.object),
    markt: PropTypes.object,
    aanmeldingen: PropTypes.array,
    plaatsvoorkeuren: PropTypes.object,
    algemenevoorkeuren: PropTypes.object,
};

module.exports = OndernemerList;
