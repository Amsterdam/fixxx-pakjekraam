const PropTypes = require('prop-types');
const React = require('react');

const OndernemerChangeBrancheForm = ({ ondernemer, branches, query, user }) => {
    const next = query.next;

    return (
        <div>
            <h2>Profiel</h2>
            <form action={`/fixme/`}>
                <div className="well well--max-width">
                    <div className="Fieldset">
                        <span className="Fieldset__header">1. Wat voor koopwaar verkoop je?</span>
                        <div className="InputField">
                            <div className="Select__wrapper">
                                <select className="Select">
                                    {branches.map(branche => (
                                        <option key={branche.brancheId} value={branche.brancheId}>
                                            {branche.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="Fieldset Fieldset--horizontal">
                        <span className="Fieldset__header">2. Wil je op een bakplaats staan?</span>
                        <div className="InputField InputField--radiobutton InputField--radio--horizontal">
                            <input id={`id_bak_false`} name={`bak`} type="radio" defaultValue="false" />
                            <label htmlFor={`id_bak_false`}>Nee</label>
                        </div>
                        <div className="InputField InputField--radiobutton InputField--radio--horizontal">
                            <input id={`id_bak_true`} name={`bak`} type="radio" defaultValue="true" />
                            <label htmlFor={`id_bak_true`}>Ja</label>
                        </div>
                    </div>

                    <div className="Fieldset Fieldset--horizontal">
                        <span className="Fieldset__header">3. Neem je eigen materiaal mee naar de markt?</span>
                        <div className="InputField InputField--radiobutton InputField--radio--horizontal">
                            <input
                                id={`id_eigenmateriaal_false`}
                                name={`eigenmateriaal`}
                                type="radio"
                                defaultValue="false"
                            />
                            <label htmlFor={`id_eigenmateriaal_false`}>Nee</label>
                        </div>
                        <div className="InputField InputField--radiobutton InputField--radio--horizontal">
                            <input
                                id={`id_eigenmateriaal_true`}
                                name={`eigenmateriaal`}
                                type="radio"
                                defaultValue="true"
                            />
                            <label htmlFor={`id_eigenmateriaal_true`}>Ja</label>
                        </div>
                    </div>
                </div>
                <div className="Fieldset">
                    <p className="InputField InputField--submit">
                        <button className="Button Button--secondary" type="submit" name="next" value={next}>
                            Opslaan
                        </button>
                        <a className="Button Button--tertiary" href={next}>
                            Terug
                        </a>
                    </p>
                </div>
            </form>
        </div>
    );
};

OndernemerChangeBrancheForm.propTypes = {
    ondernemer: PropTypes.object.isRequired,
    branches: PropTypes.array.isRequired,
    query: PropTypes.string,
    user: PropTypes.object,
};

module.exports = OndernemerChangeBrancheForm;
