const PropTypes = require('prop-types');
const React = require('react');

class Page extends React.Component {
    propTypes = {
        children: PropTypes.optionalNode,
        title: PropTypes.string,
        bodyClass: PropTypes.string,
    };

    render() {
        return (
            <html lang="nl">
                <head>
                    <meta charSet="UTF-8" />
                    <title>{this.props.title || 'Fixxx: Pak Je Kraam'}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                    <link rel="stylesheet" type="text/css" href="/style/screen.css" />
                </head>
                <body className={this.props.bodyClass}>
                    {this.props.children}
                    <script src="/js/script.js" />
                </body>
            </html>
        );
    }
}

module.exports = Page;
