import PrintableBackground from './PrintableBackground';
import PropTypes from 'prop-types';
import React from 'react';

const Plaats = ({ plaats, vph }) => {
    const colorList = {
        'branche-vis': '#343797',
        'branche-natte-vis': '#CEFFFF',
        'branche-kip': '#9ACA27',
        'branche-agf': '#2BB527',
        'experimentele-zone': '#9BCDFD',
        'branche-bak': '#FD9BCB',
        'standwerkersplaats': '#FBF136',
    };

    let plaatsProps = plaats.properties ? plaats.properties.split(',') : [],
        tags = plaats.tags || [];

    plaatsProps = plaatsProps.filter(word => !['dubble'].includes(word));
    plaatsProps.reverse();
    tags = tags.filter(word => !['even', 'oneven'].includes(word));

    let color = Object.keys(colorList).find(key => {
        return tags.length && key === tags[0].trim();
    });

    color = tags.length ? (color ? colorList[color] : '#C0C0C0') : undefined;

    tags = tags.join(' ');

    return (
        <tr className={'Plaats'}>
            <td className="Plaats__prop Plaats__prop-properties">
                <span className={'icon icon-' + (plaatsProps ? plaatsProps[0] : '')} />
            </td>
            <td className="Plaats__prop Plaats__prop-plaats-nr">
                {plaats.locatie}
                {color && <PrintableBackground color={color} />}
            </td>

            <td className="Plaats__prop Plaats__prop-vph">
                {vph ? (
                    <a href={`/profile/${vph.erkenningsNummer}/`}>
                        <strong>{vph.sollicitatieNummer}</strong>
                    </a>
                ) : null}
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
