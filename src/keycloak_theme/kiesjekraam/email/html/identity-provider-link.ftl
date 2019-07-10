<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "content">
        ${kcSanitize(msg("identityProviderLinkBodyHtml", identityProviderAlias, realmName, identityProviderContext.username, link, linkExpiration, linkExpirationFormatter(linkExpiration)))?no_esc}
    </#if>
</@layout.registrationLayout>


