const Button = require('./Button');
const PropTypes = require('prop-types');
const React = require('react');
const { formatDayOfWeek, formatDate, relativeHumanDay, WEEK_DAYS } = require('../../util.js');
const HeaderTitleButton = require('./HeaderTitleButton');

const OndernemerMarktAanwezigheid = ({ markt, rsvpEntries, sollicitatie, ondernemer }) => {
    const blockUrl = `../../afmelden/${markt.id}/?next=../../markt-detail/${markt.id}/#aanwezigheid`;

    let lastDivider = false;

    return (
        <div className="OndernemerMarktAanwezigheid background-link-parent" id="aanwezigheid">
            <a href={blockUrl} className="background-link" />
            <HeaderTitleButton title="Aanwezigheid" url={blockUrl} />
            <div className="well">
                <span>Op welke dagen staat er iemand (vergunninghouder of vervanger) in de kraam?</span>
                <ul className="OndernemerMarktAanwezigheid__list">
                    <li
                        className={`OndernemerMarktAanwezigheid__list-item OndernemerMarktAanwezigheid__list-item--today`}
                    >
                        <span className="OndernemerMarktAanwezigheid__divider">Deze week</span>
                        <span className="OndernemerMarktAanwezigheid__list-item-wrapper">
                            <strong className="OndernemerMarktAanwezigheid__week-day">
                                {relativeHumanDay(new Date())}
                            </strong>

                            <span>
                                <span className="OndernemerMarktAanwezigheid__date">{formatDate(new Date())}</span>
                                <strong className="OndernemerMarktAanwezigheid__attending" />
                            </span>
                        </span>
                    </li>
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
                                    {relativeHumanDay(date) ? (
                                        <strong className="OndernemerMarktAanwezigheid__week-day">
                                            {relativeHumanDay(date)}
                                        </strong>
                                    ) : (
                                        <span className="OndernemerMarktAanwezigheid__week-day">
                                            {formatDayOfWeek(date)}
                                        </span>
                                    )}
                                    <span>
                                        <span className="OndernemerMarktAanwezigheid__date">{formatDate(date)}</span>
                                        <strong className="OndernemerMarktAanwezigheid__attending">
                                            {attending ? `aangemeld` : `afgemeld`}
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
            </div>
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
