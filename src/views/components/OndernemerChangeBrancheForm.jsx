const PropTypes = require('prop-types');
const React = require('react');

const OndernemerChangeBrancheForm = ({ ondernemer, markten, branches, query }) => {
    console.log(markten);
    return (
        <form action={`/change-branche/`}>
            {markten.map(markt => (
                <div key={markt.id}>
                    <h2>{markt.naam}</h2>
                    <input name="" id="" value={markt.id} type="hidden" />
                    <fieldset className="Fieldset">
                        <div className="InputField">
                            <div className="Select__wrapper">
                                <select className="Select">
                                    {markt.branches.map(branche => (
                                        <option value={branche.id}>{branche.id}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </fieldset>
                </div>
            ))}
        </form>
    );
};

OndernemerChangeBrancheForm.propTypes = {
    ondernemer: PropTypes.object.isRequired,
    markten: PropTypes.array.isRequired,
    branches: PropTypes.array.isRequired,
    query: PropTypes.string,
};

module.exports = OndernemerChangeBrancheForm;
