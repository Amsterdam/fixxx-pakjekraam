const PropTypes = require('prop-types');
const React = require('react');
const { plaatsSort } = require('../../domain-knowledge.js');

const MarktplaatsSelect = ({ id, name, markt, value, optional, readonly }) => {
    const marktplaatsSort = (plaatsA, plaatsB) => plaatsSort(plaatsA.plaatsId, plaatsB.plaatsId);

    return (
        <div className="Select__wrapper">
            <select className="Select Select--MarktplaatsSelect" name={name} id={id} disabled={readonly}>
                {optional ? <option value="-1">Geen</option> : null}
                {(markt.marktplaatsen || []).sort(marktplaatsSort).map(plaats => (
                    <option key={plaats.plaatsId} value={plaats.plaatsId} selected={plaats.plaatsId === value}>
                        {plaats.plaatsId}
                    </option>
                ))}
            </select>
        </div>
    );
};

MarktplaatsSelect.propTypes = {
    markt: PropTypes.object.isRequired,
    value: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    optional: PropTypes.boolean,
    readonly: PropTypes.boolean,
};

module.exports = MarktplaatsSelect;
