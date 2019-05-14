import PropTypes from "prop-types";
import React from 'react';

const Plaats = ({ plaats, vph }) => {
    let props = plaats.properties ? plaats.properties.split(',') : [];
    props = props.filter(word => !(['dubble'].includes(word)));
    props.reverse();
    return (
        <tr className={"Plaats " + plaats.branche}>
            <td className="Plaats__prop Plaats__prop-properties"><span className={"icon icon-" + (props ? props[0] : '')}></span></td>
            <td className="Plaats__prop Plaats__prop-plaats-nr">{plaats.locatie}</td>

            <td className="Plaats__prop Plaats__prop-vph"><strong>{(vph) ? vph.sollicitatieNummer : ''}</strong></td>
            <td className="Plaats__prop Plaats__prop-vph-description">{(vph) ? vph.description : ''}</td>

            <td className="Plaats__prop Plaats__prop-empty-fields"></td>
        </tr>
    );
};

Plaats.propTypes = {
  plaats: PropTypes.object,
  vph: PropTypes.object,
};

module.exports = Plaats;
