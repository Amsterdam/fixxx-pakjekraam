<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "content">
        ${kcSanitize(msg("emailTestBodyHtml",realmName))?no_esc}
    </#if>
</@layout.registrationLayout>
