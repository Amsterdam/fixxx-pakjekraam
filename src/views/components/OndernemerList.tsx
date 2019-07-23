import PropTypes from 'prop-types';
import * as React from 'react';
import { IMarkt, IMarktondernemer, IRSVP } from '../../markt.model';

const OndernemerList = ({
    ondernemers,
    markt,
    aanmeldingen,
}: {
    ondernemers: IMarktondernemer[];
    markt: IMarkt;
    aanmeldingen: IRSVP[];
}) => (
    <div className="OndernemerList">
        <span className="OndernemerList__heading">Personen</span>
        <table className="OndernemerList__table">
            <tbody>
                {ondernemers.map(ondernemer => {
                    const aanmelding =
                        ondernemer && aanmeldingen.find(rsvp => rsvp.erkenningsNummer === ondernemer.erkenningsNummer);

                    return (
                        <tr key={ondernemer.erkenningsNummer} className={ondernemer.status}>
                            <td>
                                <span id={`soll-${ondernemer.sollicitatieNummer}`} />
                                <a href={`/profile/${ondernemer.erkenningsNummer}`}>{ondernemer.sollicitatieNummer}</a>
                            </td>
                            <td>{ondernemer.status}</td>
                            <td>{ondernemer.description}</td>

                            <td
                                className={`${
                                    aanmelding && aanmelding.attending !== null && !aanmelding.attending
                                        ? 'OndernemerList__ondernemer--not-attending'
                                        : ''
                                } ${aanmelding && aanmelding.attending ? 'OndernemerList__ondernemer--attending' : ''}`}
                            />
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
};

module.exports = OndernemerList;
