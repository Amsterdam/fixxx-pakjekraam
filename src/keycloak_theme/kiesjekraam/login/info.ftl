<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        Account instellen
    <#elseif section = "form">
    <div id="kc-info-message">
        ${message.summary}
        <#if requiredActions??>
        <ul>
        <#list requiredActions><#items as reqActionItem><li>${msg("requiredAction.${reqActionItem}")}</li></#items></#list>
        </ul>
        </#if>
        </p>
        <#if skipLink??>
        <#else>
            <#if actionUri??>
                <p><a href="${actionUri}" class="btn">${kcSanitize(msg("proceedWithAction"))?no_esc}</a></p>
            </#if>
        </#if>
    </div>
    </#if>
</@layout.registrationLayout>
