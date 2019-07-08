<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "content">
        ${kcSanitize(msg("emailVerificationBodyCodeHtml",code))?no_esc}
    </#if>
</@layout.registrationLayout>


