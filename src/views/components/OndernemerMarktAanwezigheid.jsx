const Button = require('./Button');
const OndernemerMarktHeading = require('./OndernemerMarktHeading');
const PropTypes = require('prop-types');
const React = require('react');
const { formatDayOfWeek, formatDate, WEEK_DAYS } = require('../../util.js');

const OndernemerMarktAanwezigheid = ({ markt, rsvpEntries, sollicitatie, ondernemer }) => {
    const next = `/dashboard/${ondernemer.erkenningsnummer}/#markt-${markt.id}`;

    let lastDivider = false;

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
                            {WEEK_DAYS[new Date(date).getDay()].slice(0, 2) ===
                                markt.marktDagen[markt.marktDagen.length - 1] && !lastDivider ? (
                                <span className="OndernemerMarktAanwezigheid__divider">
                                    volgende week
                                    {(lastDivider = true)}
                                </span>
                            ) : (
                                ``
                            )}
                        </li>
                    );
                })}
            </ul>
            <Button
                label="Aanwezigheid wijzigen"
                href={`/afmelden/${ondernemer.erkenningsnummer}/${markt.id}/?next=${next}`}
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
