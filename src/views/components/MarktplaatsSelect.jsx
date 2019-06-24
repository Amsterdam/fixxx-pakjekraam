const PropTypes = require('prop-types');
const React = require('react');
const { plaatsSort } = require('../../domain-knowledge.js');
const marktplaatsSort = (plaatsA, plaatsB) => plaatsSort(plaatsA.plaatsId, plaatsB.plaatsId);

const MarktplaatsSelect = ({ id, name, markt, value, optional, readonly, newItem }) => {
    const attrs = newItem ? { 'data-id': id, 'data-name': name } : { id, name };

    return (
        <div
            className={`Select__wrapper Select__wrapper--MarktplaatsSelect ${
                readonly ? 'Select__wrapper--disabled' : null
            }`}
        >
            <select className="Select Select--MarktplaatsSelect" {...attrs} disabled={readonly}>
                {/*{optional ? <option value="">Plaats</option> : null}*/}
                {/*{(markt.marktplaatsen || []).sort(marktplaatsSort).map(plaats => (*/}
                {/*<option key={plaats.plaatsId} value={plaats.plaatsId} selected={plaats.plaatsId === value}>*/}
                {/*{plaats.plaatsId}*/}
                {/*</option>*/}
                {/*))}*/}
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
    newItem: PropTypes.boolean,
};

module.exports = MarktplaatsSelect;
