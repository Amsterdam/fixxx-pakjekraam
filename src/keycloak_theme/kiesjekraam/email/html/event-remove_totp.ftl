<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "content">
        ${kcSanitize(msg("eventRemoveTotpBodyHtml",event.date, event.ipAddress))?no_esc}
    </#if>
</@layout.registrationLayout>


