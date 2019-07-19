const Alert = require('./Alert');
const PropTypes = require('prop-types');
const React = require('react');

class Page extends React.Component {
    propTypes = {
        children: PropTypes.optionalNode,
        title: PropTypes.string,
        bodyClass: PropTypes.string,
        messages: PropTypes.array,
    };

    render() {
        return (
            <html lang="nl">
                <head>
                    <meta charSet="UTF-8" />
                    <title>{this.props.title || 'Kies je kraam'}</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                    <link rel="stylesheet" type="text/css" href="/style/screen.css" />
                </head>
                <body className={this.props.bodyClass}>
                    {(this.props.messages || []).map(message => (
                        <Alert key={message.code} message={message.message} type={message.code} />
                    ))}
                    {this.props.children}
                    <script crossOrigin="anonymous" src="https://polyfill.io/v3/polyfill.min.js?features=Array.from" />
                    <script src="/js/script.js" />
                </body>
            </html>
        );
    }
}

module.exports = Page;
