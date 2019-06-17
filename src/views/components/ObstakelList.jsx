const Obstakel = require('./Obstakel');
const PropTypes = require('prop-types');
const React = require('react');

const ObstakelList = ({ obstakelList }) => {
    return (
        <tr className="ObstakelList">
            <td colSpan="6">
                {obstakelList.map((obstakel, i) => {
                    return <Obstakel key={i} obstakel={obstakel} />;
                })}
            </td>
        </tr>
    );
};

ObstakelList.propTypes = {
    obstakelList: PropTypes.array,
};

module.exports = ObstakelList;
