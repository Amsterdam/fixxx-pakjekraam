const React = require('react');

const w = 100;
const borderWidth = '2px';
const c = '#EC0000';
const e = 'transparent';
const topRight = c + ' ' + c + ' transparent transparent';
const topLeft = c + ' transparent transparent ' + c;
const bottomRight = 'transparent ' + c + ' ' + c + ' transparent';
const bottomLeft = 'transparent transparent ' + c + ' ' + c;

const fullMinTopColor = 'transparent ' + c + ' ' + c + ' ' + c;
const fullMinRightColor = c + ' transparent ' + c + ' ' + c;
const fullMinBottomColor = c + ' ' + c + ' transparent ' + c;
const fullMinLeftColor = c + ' ' + c + ' ' + c + ' transparent';

const tableStyle = { borderCollapse: 'separate !important' };
const defaultTdStyle = { width: 0, height: 0, borderStyle: 'solid', borderWidth };

const tableData = [
    [bottomRight, bottomLeft, e, bottomRight, bottomLeft],
    [topRight, c, fullMinTopColor, c, topLeft],
    [e, fullMinLeftColor, c, fullMinRightColor, e],
    [bottomRight, c, fullMinBottomColor, c, bottomLeft],
    [topRight, topLeft, e, topRight, topLeft],
    [e, e, e, e, e],
];

const EmailLogo = () => {
    return (
        <table cellPadding="0" cellSpacing="0" border="0" width="8" style={tableStyle}>
            {[tableData, tableData, tableData]
                .reduce((total, data) => {
                    return total.concat(data);
                }, [])
                .map((tr, i) => (
                    <tr key={i}>
                        {tr.map((borderColor, j) => {
                            const tdStyle = { ...defaultTdStyle, ...{ borderColor } };

                            return <td key={j} width={w} height={w} align="center" valign="middle" style={tdStyle} />;
                        })}
                    </tr>
                ))}
        </table>
    );
};

module.exports = EmailLogo;
