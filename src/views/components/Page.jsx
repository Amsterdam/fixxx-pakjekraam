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
                    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                    <link rel="icon" type="image/png" href="/favicon_32x32.png" sizes="32x32" />
                    <link rel="icon" type="image/png" href="/favicon_192×192.png" sizes="192×192" />
                    <link rel="shortcut icon" href="/favicon.ico" />
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
