const PropTypes = require('prop-types');
const React = require('react');
const EmailLogo = require('./EmailLogo');
const headStyle =
    '' +
    '                /* CLIENT-SPECIFIC STYLES */\n' +
    '                    body, table, td, a{-webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;} /* Prevent WebKit and Windows mobile changing default text sizes */\n' +
    '                    table, td{mso-table-lspace: 0pt; mso-table-rspace: 0pt;} /* Remove spacing between tables in Outlook 2007 and up */\n' +
    '                    img{-ms-interpolation-mode: bicubic;} /* Allow smoother rendering of resized image in Internet Explorer */\n' +
    '\n' +
    '                    /* RESET STYLES */\n' +
    '                    img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none;}\n' +
    '                    table{border-collapse: collapse !important;}\n' +
    '                    body{height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important;}\n' +
    '\n' +
    '                    /* iOS BLUE LINKS */\n' +
    '                    a[x-apple-data-detectors] {\n' +
    '                        color: inherit !important;\n' +
    '                        text-decoration: none !important;\n' +
    '                        font-size: inherit !important;\n' +
    '                        font-family: inherit !important;\n' +
    '                        font-weight: inherit !important;\n' +
    '                        line-height: inherit !important;\n' +
    '                    }\n' +
    '\n' +
    '                    /* MOBILE STYLES */\n' +
    '                    @media screen and (max-width: 525px) {\n' +
    '\n' +
    '                        /* ALLOWS FOR FLUID TABLES */\n' +
    '                        .wrapper {\n' +
    '                          width: 100% !important;\n' +
    '                            max-width: 100% !important;\n' +
    '                        }\n' +
    '\n' +
    '                        /* ADJUSTS LAYOUT OF LOGO IMAGE */\n' +
    '                        .logo img {\n' +
    '                          margin: 0 auto !important;\n' +
    '                        }\n' +
    '\n' +
    '                        /* USE THESE CLASSES TO HIDE CONTENT ON MOBILE */\n' +
    '                        .mobile-hide {\n' +
    '                          display: none !important;\n' +
    '                        }\n' +
    '\n' +
    '                        .img-max {\n' +
    '                          max-width: 100% !important;\n' +
    '                          width: 100% !important;\n' +
    '                          height: auto !important;\n' +
    '                        }\n' +
    '\n' +
    '                        /* FULL-WIDTH TABLES */\n' +
    '                        .responsive-table {\n' +
    '                          width: 100% !important;\n' +
    '                        }\n' +
    '\n' +
    '                        /* UTILITY CLASSES FOR ADJUSTING PADDING ON MOBILE */\n' +
    '                    .padding {\n' +
    '                      padding: 10px 5% 15px 5% !important;\n' +
    '                    }\n' +
    '\n' +
    '                    .padding-meta {\n' +
    '                      padding: 30px 5% 0px 5% !important;\n' +
    '                      text-align: center;\n' +
    '                    }\n' +
    '\n' +
    '                    .padding-copy {\n' +
    '                         padding: 10px 5% 10px 5% !important;\n' +
    '                      text-align: center;\n' +
    '                    }\n' +
    '\n' +
    '                    .no-padding {\n' +
    '                      padding: 0 !important;\n' +
    '                    }\n' +
    '\n' +
    '                    .section-padding {\n' +
    '                      padding: 50px 15px 50px 15px !important;\n' +
    '                    }\n' +
    '\n' +
    '                    /* ADJUST BUTTONS ON MOBILE */\n' +
    '                    .mobile-button-container {\n' +
    '                        margin: 0 auto;\n' +
    '                        width: 100% !important;\n' +
    '                    }\n' +
    '\n' +
    '                    .mobile-button {\n' +
    '                        padding: 15px !important;\n' +
    '                        border: 0 !important;\n' +
    '                        font-size: 16px !important;\n' +
    '                        display: block !important;\n' +
    '                    }\n' +
    '\n' +
    '                }\n' +
    '\n' +
    '                /* ANDROID CENTER FIX */\n' +
    '                div[style*="margin: 16px 0;"] { margin: 0 !important; }';

const fontHeading = {
    padding: '0',
    fontSize: '30px',
    lineHeight: '30px',
    fontFamily: 'Helvetica, Arial, sans-serif',
    color: '#333333',
    fontWeight: '400',
};
const fontLogo = {
    height: '20px',
    padding: '0',
    fontSize: '14px',
    lineHeight: '20px',
    fontFamily: 'Helvetica, Arial, sans-serif',
    color: 'red',
    fontWeight: '400',
};

const EmailBase = ({ children, subject, domain, appName }) => {
    return (
        <html>
            <head>
                <title>{subject}</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <style type="text/css" dangerouslySetInnerHTML={{ __html: headStyle }} />
            </head>
            <body style={{ margin: '0 !important', padding: '0 !important' }}>
                <table border="0" cellPadding="0" cellSpacing="0" width="100%">
                    <tr>
                        <td bgcolor="#ffffff" align="center" style={{ padding: '15px' }} className="section-padding">
                            {/*// <!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellSpacing="0" cellPadding="0" width="500">*/}
                            {/*// <tr>*/}
                            {/*// <td align="center" valign="top" width="500">*/}
                            {/*// <![endif]-->*/}
                            <table
                                border="0"
                                cellPadding="0"
                                cellSpacing="0"
                                width="100%"
                                style={{ maxWidth: '500px' }}
                                className="responsive-table"
                            >
                                <tr>
                                    <td>
                                        <table width="100%" border="0" cellSpacing="0" cellPadding="0">
                                            <tr>
                                                <td style={{ padding: '10px 5% 10px 5%' }}>
                                                    <table>
                                                        <tr>
                                                            <td>
                                                                <EmailLogo />
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding: '0 10px 0 10px',
                                                                    verticalAlign: 'top',
                                                                }}
                                                            >
                                                                <table>
                                                                    <tr>
                                                                        <td style={fontLogo}>Gemeente</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={fontLogo}>Amsterdam</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                            <td style={{ verticalAlign: 'top' }}>
                                                                <table
                                                                    width="100%"
                                                                    border="0"
                                                                    cellSpacing="0"
                                                                    cellPadding="0"
                                                                >
                                                                    <tr>
                                                                        <td
                                                                            align="left"
                                                                            style={fontHeading}
                                                                            className="padding-copy"
                                                                        >
                                                                            {appName}
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td bgcolor="#f5f5f5">
                                        <table
                                            bgcolor="#f5f5f5"
                                            width="100%"
                                            border="0"
                                            cellSpacing="0"
                                            cellPadding="0"
                                            style={{
                                                backgroundColor: '#f5f5f5',
                                                borderBottom: '1px solid #bdbdbd',
                                                boxShadow: '0 1px 3px 0 #ccc',
                                            }}
                                        >
                                            <tr>
                                                <td style={{ padding: '10px 5% 30px 5%' }}>{children}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            {/*// <!--[if (gte mso 9)|(IE)]>*/}
                            {/*// </td>*/}
                            {/*// </tr>*/}
                            {/*// </table>*/}
                            {/*// <![endif]-->*/}
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" align="center" style={{ padding: '20px 0p' }}>
                            {/*// <!--[if (gte mso 9)|(IE)]>*/}
                            {/*// <table align="center" border="0" cellSpacing="0" cellPadding="0" width="500">*/}
                            {/*// <tr>*/}
                            {/*// <td align="center" valign="top" width="500">*/}
                            {/*// <![endif]-->*/}
                            <table
                                width="100%"
                                border="0"
                                cellSpacing="0"
                                cellPadding="0"
                                align="center"
                                style={{ maxWidth: '500px' }}
                                className="responsive-table"
                            >
                                <tr>
                                    <td
                                        align="left"
                                        style={{
                                            fontSize: '12px',
                                            lineHeight: '18px',
                                            fontFamily: 'Helvetica, Arial, sans-serif',
                                            color: '#666666',
                                        }}
                                    >
                                        <table width="100%" border="0" cellSpacing="0" cellPadding="0">
                                            <tr>
                                                <td style={{ padding: '10px 5% 10px 5%' }}>
                                                    <table width="100%" border="0" cellSpacing="0" cellPadding="0">
                                                        <tr>
                                                            <td align="left" className="padding-copy">
                                                                <a
                                                                    href={`https://${domain}`}
                                                                    style={{
                                                                        fontSize: '12px',
                                                                        lineHeight: '18px',
                                                                        fontFamily: 'Helvetica, Arial, sans-serif',
                                                                        color: '#666666',
                                                                        textDecoration: 'none',
                                                                    }}
                                                                >
                                                                    {appName}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            {/*// <!--[if (gte mso 9)|(IE)]>*/}
                            {/*// </td>*/}
                            {/*// </tr>*/}
                            {/*// </table>*/}
                            {/*// <![endif]-->*/}
                        </td>
                    </tr>
                </table>
            </body>
        </html>
    );
};

EmailBase.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    subject: PropTypes.string,
    domain: PropTypes.string,
    appName: PropTypes.string,
};

module.exports = EmailBase;
