<#macro mainLayout active bodyClass>
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">

    <title>${msg("accountManagementTitle")}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico">
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script type="text/javascript" src="${url.resourcesPath}/${script}"></script>
        </#list>
    </#if>
</head>
<body class="admin-console user ${bodyClass}">
    <#if message?has_content>
        <div class="Alert alert-${message.type}">
            <#if message.type=='success' ><span class="pficon pficon-ok"></span></#if>
            <#if message.type=='error' ><span class="pficon pficon-error-octagon"></span><span class="pficon pficon-error-exclamation"></span></#if>
            ${kcSanitize(message.summary)?no_esc}
        </div>
    </#if>
    <header class="Header">
        <div class="Header__top">
            <div class="container">
                <div class="container__content">
                    <div class="Header__top-container"><a class="Header__logo-link" href="/">
                            <picture class="Header__logo">
                                <source srcSet="/images/logo-desktop.svg" media="(min-width: 540px)" />
                                <source srcSet="/images/logo-mobile.svg" media="(min-width: 0)" /><img srcSet="/images/logo-desktop.svg" alt="…" /></picture>
                        </a>
                        <h1 class="Header__heading">Pak je kraam</h1>
                        <div>
                            <ul class="nav navbar-nav navbar-utility">
                                <#if realm.internationalizationEnabled>
                                    <li>
                                        <div class="kc-dropdown" id="kc-locale-dropdown">
                                            <a href="#" id="kc-current-locale-link">${locale.current}</a>
                                            <ul>
                                                <#list locale.supported as l>
                                                    <li class="kc-dropdown-item"><a href="${l.url}">${l.label}</a></li>
                                                </#list>
                                            </ul>
                                        </div>
                                    <li>
                                </#if>
                                <#if referrer?has_content && referrer.url?has_content><li><a href="${referrer.url}" id="referrer">${msg("backTo",referrer.name)}</a></li></#if>
                                <li><a href="${url.logoutUrl}">${msg("doSignOut")}</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="Header__bottom">
            <div class="container">
                <div class="container__content">
                    <div class="Header__bottom-container"></div>
                </div>
            </div>
        </div>
    </header>

    <main class="content container">
        <div class="container__content">
            <ul>
                <li class="<#if active=='account'>active</#if>"><a href="${url.accountUrl}">${msg("account")}</a></li>
                <#if features.passwordUpdateSupported><li class="<#if active=='password'>active</#if>"><a href="${url.passwordUrl}">${msg("password")}</a></li></#if>
                <li class="<#if active=='totp'>active</#if>"><a href="${url.totpUrl}">${msg("authenticator")}</a></li>
                <#if features.identityFederation><li class="<#if active=='social'>active</#if>"><a href="${url.socialUrl}">${msg("federatedIdentity")}</a></li></#if>
                <li class="<#if active=='sessions'>active</#if>"><a href="${url.sessionsUrl}">${msg("sessions")}</a></li>
                <li class="<#if active=='applications'>active</#if>"><a href="${url.applicationsUrl}">${msg("applications")}</a></li>
                <#if features.log><li class="<#if active=='log'>active</#if>"><a href="${url.logUrl}">${msg("log")}</a></li></#if>
                <#if realm.userManagedAccessAllowed && features.authorization><li class="<#if active=='authorization'>active</#if>"><a href="${url.resourceUrl}">${msg("myResources")}</a></li></#if>
            </ul>
            <#nested "content">
        </div>
    </main>
</body>
</html>
</#macro>
