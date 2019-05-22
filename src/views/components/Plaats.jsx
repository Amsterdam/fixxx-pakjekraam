import PrintableBackground from './PrintableBackground';
import PropTypes from 'prop-types';
import React from 'react';

const Plaats = ({ plaats, vph, first, aanmelding }) => {
    const colorList = {
        'branche-vis': '#343797',
        vis: '#343797',
        'branche-natte-vis': '#CEFFFF',
        'natte-vis': '#CEFFFF',
        'branche-kip': '#9ACA27',
        kip: '#9ACA27',
        'branche-agf': '#2BB527',
        agf: '#2BB527',
        'exo-groente': '#2BB527',
        'streek-groente': '#2BB527',
        kas: '#2BB527',
        blm: '#6bb592',
        bloemen: '#6bb592',
        'experimentele-zone': '#9BCDFD',
        exp: '#9BCDFD',
        zui: '#825ffd',
        'kaas-zuivel': '#825ffd',
        kaas: '#825ffd',
        'branche-bak': '#FD9BCB',
        bak: '#FD9BCB',
        patat: '#FD9BCB',
        baks7: '#FD9BCB',
        baks6: '#FD9BCB',
        baks5: '#FD9BCB',
        baks4: '#FD9BCB',
        'gebakken-vis': '#FD9BCB',
        olv: '#FD9BCB',
        noten: '#FD9BCB',
        snacks: '#FD9BCB',
        bakker: '#FD9BCB',
        'snacks-loempia': '#FD9BCB',
        standwerkersplaats: '#FBF136',
        brc: '#C0C0C0',
        food: '#C0C0C0',
        keukenartikelen: '#C0C0C0',
        borstel: '#C0C0C0',
        dameskleding: '#C0C0C0',
        'nacht-en-ondermode': '#C0C0C0',
        horloges: '#C0C0C0',
        modestoffen: '#C0C0C0',
        sieraden: '#C0C0C0',
        drogisterij: '#C0C0C0',
        beenmode: '#C0C0C0',
        tapijten: '#C0C0C0',
        babykleding: '#C0C0C0',
        schoenen: '#C0C0C0',
        tassen: '#C0C0C0',
        stn: '#C0C0C0',
        promo: '#C0C0C0',
    };

    let plaatsProps = plaats.properties ? plaats.properties.split(',') : [],
        tags = plaats.tags || [];
    const branches = plaats.branche || [];

    plaatsProps = plaatsProps.filter(word => !['dubble'].includes(word));
    plaatsProps.reverse();
    tags = tags.filter(word => !['even', 'oneven'].includes(word));

    let color = Object.keys(colorList).find(key => {
        return tags.length && key === tags[0].trim();
    });

    color = branches.length
        ? colorList[branches[branches.length - 1]]
            ? colorList[branches[branches.length - 1]]
            : '#000000'
        : undefined;

    tags = tags.join(' ');

    return (
        <tr className={'Plaats ' + (first && 'Plaats--first')}>
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
            <td
                className={`Plaats__prop Plaats__prop-vph-description ${
                    aanmelding && aanmelding.attending === false ? 'Plaats--vph-attendance-not-attending' : ''
                } ${aanmelding ? 'Plaats--vph-attendance-verified' : ''}
                `}
            >
                {vph ? vph.description : ''}
            </td>
            <td className="Plaats__prop Plaats__prop-empty-fields">{aanmelding ? '🆗' : null}</td>
        </tr>
    );
};
Plaats.propTypes = {
    plaats: PropTypes.object.isRequired,
    vph: PropTypes.object,
    first: PropTypes.bool,
    aanmelding: PropTypes.object,
};

module.exports = Plaats;
