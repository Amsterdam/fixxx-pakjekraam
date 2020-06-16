#!groovy

// Project Settings for Deployment
String PROJECTNAME = "fixxx/pakjekraam"
String CONTAINERDIR = "."
String PRODUCTION_BRANCH = "production"
String ACCEPTANCE_BRANCH = "acceptance"
String PLAYBOOK = 'deploy.yml'

// All other data uses variables, no changes needed for static
String BRANCH = "${env.BRANCH_NAME}"

image = 'initial value'

def tryStep(String message, Closure block, Closure tearDown = null) {
    try {
        block();
    }
    catch (Throwable t) {
        throw t;
    }
    finally {
        if (tearDown) {
            tearDown();
        }
    }
}

node {
    stage("Checkout") {
        checkout scm
    }

    stage("Install") {
        sh 'NODE_ENV=development npm ci'
    }

    stage("Lint") {
        sh 'npm run lint'
    }

    stage("Test") {
        sh 'npm run test'
    }

    stage("Build image") {
        tryStep "build", {
            echo 'start git version'
            sh "git rev-parse HEAD > version_file"
            def commit_id = readFile('version_file').trim()
            sh 'echo SOURCE_COMMIT := $commit_id >> .build'
            println commit_id
            echo 'end git version'
            image = docker.build("build.app.amsterdam.nl:5000/${PROJECTNAME}:${env.BUILD_NUMBER}")
            image.push()
        }
    }

// Acceptance branch, fetch the container, label with acceptance and deploy to acceptance.
if (BRANCH == "${ACCEPTANCE_BRANCH}") {
    stage("Deploy to ACC") {
        tryStep "deployment", {
            image.push("acceptance")
            build job: 'Subtask_Openstack_Playbook',
                parameters: [
                    [$class: 'StringParameterValue', name: 'INVENTORY', value: 'acceptance'],
                    [$class: 'StringParameterValue', name: 'PLAYBOOK', value: "${PLAYBOOK}"],
                    [$class: 'StringParameterValue', name: 'PLAYBOOKPARAMS', value: "-e cmdb_id=app_pakjekraam"],
                ]
        }
    }
}

// On production branch, fetch the container, tag with production and latest and deploy to production
if (BRANCH == "${PRODUCTION_BRANCH}") {
    stage("Deploy to PROD") {
        tryStep "deployment", {
            image.push("production")
            image.push("latest")
            build job: 'Subtask_Openstack_Playbook',
                parameters: [
                    [$class: 'StringParameterValue', name: 'INVENTORY', value: 'production'],
                    [$class: 'StringParameterValue', name: 'PLAYBOOK', value: "${PLAYBOOK}"],
                    [$class: 'StringParameterValue', name: 'PLAYBOOKPARAMS', value: "-e cmdb_id=app_pakjekraam"],
                ]
        }
    }
}

}
