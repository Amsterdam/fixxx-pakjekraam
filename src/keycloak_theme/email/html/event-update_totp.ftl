<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "content">
        ${kcSanitize(msg("eventUpdateTotpBodyHtml",event.date, event.ipAddress))?no_esc}
    </#if>
</@layout.registrationLayout>


