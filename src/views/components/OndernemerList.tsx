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
        <table className="OndernemerList__table">
            <thead>
                <tr>
                    <th>Nr.</th>
                    <th>Sollicitant</th>
                    <th>Status</th>
                    <th />
                </tr>
            </thead>
            <tbody>
                {ondernemers.map(ondernemer => {
                    const aanmelding =
                        ondernemer && aanmeldingen.find(rsvp => rsvp.erkenningsNummer === ondernemer.erkenningsNummer);

                    return (
                        <tr key={ondernemer.erkenningsNummer}>
                            <td>
                                <strong>
                                    <span id={`soll-${ondernemer.sollicitatieNummer}`} />
                                    <a href={`/profile/${ondernemer.erkenningsNummer}`}>
                                        {ondernemer.sollicitatieNummer}
                                    </a>
                                </strong>
                            </td>
                            <td>{ondernemer.description}</td>
                            <td>{ondernemer.status}</td>
                            <td
                                className={`${
                                    aanmelding && aanmelding.attending !== null && !aanmelding.attending
                                        ? 'OndernemerList__ondernemer--not-attending'
                                        : ''
                                } ${aanmelding ? 'OndernemerList__ondernemer--attending' : ''}`}
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
    aanmeldingen: PropTypes.object,
};

module.exports = OndernemerList;
