const PropTypes = require('prop-types');
const React = require('react');

const OndernemerChangeBrancheForm = ({ ondernemer, branches, query, user }) => {
    const next = '';
    return (
        <div>
            <h2>Je branche instellingen</h2>
            <form action={`/change-branche/`} className="well">
                <fieldset className="Fieldset">
                    <span className="Fieldset__header">1. Branche</span>
                    <div className="InputField">
                        <div className="Select__wrapper">
                            <select className="Select">
                                {branches.map(branche => (
                                    <option value={branche.id}>{branche.id}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="Fieldset">
                    <span className="Fieldset__header">2. Bakken</span>
                    <div className="InputField">
                        <div className="Select__wrapper">
                            <select className="Select">
                                {branches.map(branche => (
                                    <option value={branche.id}>{branche.id}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="Fieldset">
                    <span className="Fieldset__header">3. Bakken</span>
                    <div className="InputField">
                        <div className="Select__wrapper">
                            <select className="Select">
                                {branches.map(branche => (
                                    <option value={branche.id}>{branche.id}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                <fieldset className="Fieldset">
                    <p className="InputField InputField--submit">
                        <button className="Button Button--secondary" type="submit" name="next" value={next}>
                            Opslaan en terug
                        </button>
                        <a className="Button Button--tertiary" href={next}>
                            Terug
                        </a>
                    </p>
                </fieldset>
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
