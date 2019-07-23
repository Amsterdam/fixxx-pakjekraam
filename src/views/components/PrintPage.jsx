const PrintPageHeader = require('./PrintPageHeader');
const PropTypes = require('prop-types');
const React = require('react');

const PrintPage = ({ children, index, title, label, datum }) => {
    return (
        <div className="PrintPage">
            <div className="PrintPage__ratio" data-ratio="210:297">
                <div className="PrintPage__wrapper">
                    <PrintPageHeader>
                        <h3 className="PrintPage__heading">
                            {title}
                            {label ? (
                                <span className="PrintPage__label">{label}</span>
                            ) : index ? (
                                <span className="PrintPage__index">{index + 1}</span>
                            ) : null}
                            <span className="PrintPage__date">{datum}</span>
                        </h3>
                    </PrintPageHeader>
                    <div className="PrintPage__list-wrapper">{children}</div>
                </div>
            </div>
        </div>
    );
};

PrintPage.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    index: PropTypes.number,
    title: PropTypes.string,
    label: PropTypes.string,
    datum: PropTypes.string,
};

module.exports = PrintPage;
