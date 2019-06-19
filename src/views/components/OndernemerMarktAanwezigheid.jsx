const Button = require('./Button');
const PropTypes = require('prop-types');
const React = require('react');
const { formatDayOfWeek, formatDate, WEEK_DAYS } = require('../../util.js');

const OndernemerMarktAanwezigheid = ({ markt, rsvpEntries, sollicitatie, ondernemer }) => {
    const next = `/dashboard/${ondernemer.erkenningsnummer}/#markt-${markt.id}`;

    let lastDivider = false;

    return (
        <div className="OndernemerMarktAanwezigheid">
            <h3>Aanwezigheid</h3>
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
                            {i === 0 ? <span className="OndernemerMarktAanwezigheid__divider">deze week</span> : null}
                            <span className="OndernemerMarktAanwezigheid__list-item-wrapper">
                                <strong className="OndernemerMarktAanwezigheid__week-day">
                                    {formatDayOfWeek(date)}
                                </strong>
                                <span>
                                    <span className="OndernemerMarktAanwezigheid__date">{formatDate(date)}</span>
                                    <strong className="OndernemerMarktAanwezigheid__attending">
                                        {attending ? `aanwezig` : `afwezig`}
                                    </strong>
                                </span>
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
                label="Wijzigen aanwezigheid"
                type={`secondary`}
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
