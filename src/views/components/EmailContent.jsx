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

const EmailContent = ({ children }) => {
    return (
        <table width="100%" border="0" cellSpacing="0" cellPadding="0">
            <tr>
                <td align="left" className="padding-copy" style={fontBody}>
                    {children}
                </td>
            </tr>
        </table>
    );
};

EmailContent.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
};

module.exports = EmailContent;
