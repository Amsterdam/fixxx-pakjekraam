<#import "template.ftl" as layout>
<@layout.mainLayout active='account' bodyClass='user'; section>

    <div class="row">
        <div class="col-md-10">
            <h2>${msg("editAccountHtmlTitle")}</h2>
        </div>
        <div class="col-md-2 subtitle">
            <span class="subtitle"><span class="required">*</span> ${msg("requiredFields")}</span>
        </div>
    </div>

    <form action="${url.accountUrl}" class="form-horizontal" method="post">
        <fieldset class="Fieldset">
            <input type="hidden" id="stateChecker" name="stateChecker" value="${stateChecker}">

            <#if !realm.registrationEmailAsUsername>
                    <div class="InputField ${messagesPerField.printIfExists('username','has-error')}">
                        <label for="username" class="Label">${msg("username")}</label> <#if realm.editUsernameAllowed><span class="required">*</span></#if>
                        <input type="text" class="Input Input--text" id="username" name="username" <#if !realm.editUsernameAllowed>disabled="disabled"</#if> value="${(account.username!'')}"/>
                    </div>
            </#if>

            <div class="InputField ${messagesPerField.printIfExists('email','has-error')}">
                    <label for="email" class="Label">${msg("email")}</label> <span class="required">*</span>
                    <input type="text" class="Input Input--text" id="email" name="email" autofocus value="${(account.email!'')}"/>
            </div>

            <div class="InputField ${messagesPerField.printIfExists('firstName','has-error')}">
                    <label for="firstName" class="Label">${msg("firstName")}</label> <span class="required">*</span>
                    <input type="text" class="Input Input--text" id="firstName" name="firstName" value="${(account.firstName!'')}"/>
            </div>

            <div class="InputField ${messagesPerField.printIfExists('lastName','has-error')}">
                    <label for="lastName" class="Label">${msg("lastName")}</label> <span class="required">*</span>
                    <input type="text" class="Input Input--text" id="lastName" name="lastName" value="${(account.lastName!'')}"/>
            </div>

            <div class="InputField InputField--submit">
                        <#if url.referrerURI??><a href="${url.referrerURI}">${kcSanitize(msg("backToApplication")?no_esc)}</a></#if>
                        <button type="submit" class="Input Input--submit-secondary" name="submitAction" value="Save">${msg("doSave")}</button>
                        <button type="submit" class="Input Input--submit-primary" name="submitAction" value="Cancel">${msg("doCancel")}</button>
            </div>
        </fieldset
    </form>

</@layout.mainLayout>
