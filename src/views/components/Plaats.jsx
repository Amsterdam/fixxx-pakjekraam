import PropTypes from 'prop-types';
import React from 'react';

const Plaats = ({ plaats, vph }) => {
    let plaatsProps = plaats.properties ? plaats.properties.split(',') : [],
        tags = plaats.tags || [];

    plaatsProps = plaatsProps.filter(word => !['dubble'].includes(word));
    plaatsProps.reverse();
    tags = tags.join(' ');

    return (
        <tr className={'Plaats ' + (plaats.branche ? plaats.branche : '') + ' ' + tags }>
            <td className="Plaats__prop Plaats__prop-properties">
                <span className={'icon icon-' + (plaatsProps ? plaatsProps[0] : '')} />
            </td>
            <td className="Plaats__prop Plaats__prop-plaats-nr">{plaats.locatie}</td>

            <td className="Plaats__prop Plaats__prop-vph">
                <strong>{vph ? vph.sollicitatieNummer : ''}</strong>
            </td>
            <td className="Plaats__prop Plaats__prop-vph-description">{vph ? vph.description : ''}</td>

            <td className="Plaats__prop Plaats__prop-empty-fields" />
        </tr>
    );
};

Plaats.propTypes = {
    plaats: PropTypes.object,
    vph: PropTypes.object,
};

module.exports = Plaats;
