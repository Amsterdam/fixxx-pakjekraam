const KcAdminClient = require('keycloak-admin').default;
const { requireOne } = require('./util.js');

const clientConfig = {
    baseUrl: process.env.IAM_URL,
    realmName: process.env.IAM_REALM,
};

const authConfig = {
    username: process.env.IAM_ADMIN_USER,
    password: process.env.IAM_ADMIN_PASS,
    grantType: 'password',
    clientId: process.env.IAM_CLIENT_ID,
    clientSecret: process.env.IAM_CLIENT_SECRET,
};

const getKeycloakAdmin = () => {
    /*
     * TODO: Use RxJS to return a Observable instead of a Promise and:
     * - connects on demand
     * - refreshes the access token
     * - reconnects when refreshing fails
     */
    const kcAdminClient = new KcAdminClient(clientConfig);

    return kcAdminClient.auth(authConfig).then(() => kcAdminClient);
};

const userExists = username =>
    getKeycloakAdmin()
        .then(kcAdminClient => kcAdminClient.users.findOne({ username }))
        .then(requireOne)
        .then(() => true, () => false);

module.exports = {
    getKeycloakAdmin,
    userExists,
};
