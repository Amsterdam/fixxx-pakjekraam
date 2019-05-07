var React = require('react');

class Page extends React.Component {
    render() {
        return (
            <html lang="en">
                <head>
                    <meta charSet="UTF-8" />
                    <title>{this.props.title || 'Fixxx: Pak Je Kraam'}</title>
                    <link rel="stylesheet" type="text/css" href="style/screen.css" />
                </head>
                <body>{this.props.children}</body>
            </html>
        );
    }
}

module.exports = Page;
