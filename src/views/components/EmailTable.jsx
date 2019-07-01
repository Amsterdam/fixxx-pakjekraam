const PropTypes = require('prop-types');
const React = require('react');
const fontBody = {
    padding: '0',
    fontSize: '16px',
    lineHeight: '22px',
    fontFamily: 'Helvetica, Arial, sans-serif',
    color: '#333333',
    fontWeight: '400',
};

const EmailTable = ({ data }) => {
    console.log(data[0].length);
    return (
        <table width="100%" border="0" cellSpacing="0" cellPadding="0">
            {data.map((row, j) => (
                <tr key={j}>
                    {row.map((col, i) => (
                        <td key={i}>{i === 0 ? <span>{col}</span> : <strong>{col}</strong>}</td>
                    ))}
                </tr>
            ))}
        </table>
    );
};

EmailTable.propTypes = {
    data: PropTypes.array,
};

module.exports = EmailTable;
