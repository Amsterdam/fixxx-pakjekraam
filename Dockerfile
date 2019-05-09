
FROM mhart/alpine-node:12.0.0

RUN mkdir -p /srv \
    && addgroup -g 1000 node \
    && adduser \
        -D \
        -G node \
        -h /srv \
        -s /bin/sh \
        -u 1000 \
        node \
    && chown -R node:node /srv

USER node

WORKDIR /srv/

ADD ./package.json ./package-lock.json /srv/

# Add `NPM_TOKEN` right before the first `npm install`

ARG NPM_TOKEN

# Do not create or update `package-lock.json` inside the container,
# and prevent npm from showing a warning about the lock file.

ARG NODE_ENV

# Performance optimization: skip build process during development.

RUN if test "$NODE_ENV" = 'development'; \
then \
    echo "//registry.npmjs.org/:_authToken=\"${NPM_TOKEN}\"" > .npmrc \
    && npm install \
    && rm .npmrc \
    && npm cache clean --force 2> /dev/null \
; fi

ADD ./ /srv/

# After building the application, remove the `devDependencies`
# for when NODE_ENV is "production".

RUN if test "$NODE_ENV" != 'development'; \
then \
    echo "//registry.npmjs.org/:_authToken=\"${NPM_TOKEN}"\" >> .npmrc \
    && NODE_ENV=development npm install \
    && rm .npmrc \
    && npm cache clean --force 2> /dev/null \
    && npm run build \
    && npm prune \
; fi

ARG BUILD_DATE
ARG VCS_REF

LABEL \
    org.label-schema.build-date="${BUILD_DATE}" \
    org.label-schema.description="Pak je kraam" \
    org.label-schema.name="pakjekraam" \
    org.label-schema.schema-version="2.0" \
    org.label-schema.url="https://github.com/Amsterdam/fixxx-pakjekraam/" \
    org.label-schema.usage="https://github.com/Amsterdam/fixxx-pakjekraam/blob/master/README.md" \
    org.label-schema.vcs-ref="${VCS_REF}" \
    org.label-schema.vcs-url="https://github.com/Amsterdam/fixxx-pakjekraam" \
    org.label-schema.vendor="Amsterdam" \
    org.label-schema.version="12.0.0"

# Add lowercase proxy settings for compatibility,
# but use uppercase exports for shellcheck compatibility.
# https://unix.stackexchange.com/a/212972
ENV \
    HTTP_PROXY=$HTTP_PROXY \
    HTTPS_PROXY=$HTTPS_PROXY \
    NO_PROXY=$NO_PROXY \
    http_proxy=$HTTP_PROXY \
    https_proxy=$HTTPS_PROXY \
    no_proxy=$NO_PROXY

EXPOSE 8080/tcp

ENTRYPOINT ["npm", "run"]

CMD ["start"]
