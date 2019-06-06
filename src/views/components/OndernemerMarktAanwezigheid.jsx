const Button = require('./Button');
const OndernemerMarktHeading = require('./OndernemerMarktHeading');
const PropTypes = require('prop-types');
const React = require('react');
const { formatDayOfWeek, formatDate, DAYS_IN_WEEK } = require('../../util.js');

const OndernemerMarktAanwezigheid = ({ markt, rsvpEntries, sollicitatie, ondernemer }) => {
    return (
        <div className="OndernemerMarktAanwezigheid well">
            <OndernemerMarktHeading markt={markt} sollicitatie={sollicitatie} />
            <ul className="OndernemerMarktAanwezigheid__list">
                {rsvpEntries.map(({ date, rsvp, index }, i) => {
                    const attending = rsvp
                        ? rsvp.attending
                        : sollicitatie.status === 'vkk' || sollicitatie.status === 'vpl';

                    return (
                        <li
                            key={date}
                            className={`OndernemerMarktAanwezigheid__list-item OndernemerMarktAanwezigheid__list-item--${
                                attending ? 'attending' : 'not-attending'
                            }`}
                        >
                            <span className="OndernemerMarktAanwezigheid__list-item-wrapper">
                                <strong>{formatDayOfWeek(date)}</strong>
                                <span>{formatDate(date)}</span>
                            </span>
                            {new Date(date).getDay() === DAYS_IN_WEEK - 1 && i < DAYS_IN_WEEK ? (
                                <hr className="OndernemerMarktAanwezigheid__divider" />
                            ) : (
                                ``
                            )}
                        </li>
                    );
                })}
            </ul>
            <Button
                label="Aanwezigheid doorgeven"
                href={`/afmelden/${ondernemer.erkenningsnummer}/${markt.id}/?next=/dashboard/${
                    ondernemer.erkenningsnummer
                }/#markt-${markt.id}`}
            />
        </div>
    );
};

OndernemerMarktAanwezigheid.propTypes = {
    markt: PropTypes.object,
    sollicitatie: PropTypes.object,
    ondernemer: PropTypes.object,
    rsvpEntries: PropTypes.array,
};

module.exports = OndernemerMarktAanwezigheid;
