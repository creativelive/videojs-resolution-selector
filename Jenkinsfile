node("code") {
 try {
    stage('Clone Repository') {
        /* Let's make sure we have the repository cloned to our workspace */
        checkout scm
    }

    stage('Check Version') {
        sh '.build/01-version.sh'
        def version = readFile "${env.WORKSPACE}/.version.tmp"
        currentBuild.displayName = version
    }

    stage('Build') {
        sh '.build/02-build.sh'
    }

    stage('Commit' ) {
        withCredentials([usernamePassword(credentialsId: 'builder', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASSWORD')]) {
          sh '.build/04-commit.sh'
        }
    }

    stage('Publish to NPM') {
       sh '.build/05-npm-publish.sh'
    }
 }
 catch (e) {
   echo 'failed'
   throw e
 }
 finally {
         def currentResult = currentBuild.result ?: 'SUCCESS'
         if (currentResult == 'UNSTABLE') {
             echo 'Build is unstable!'
         }

         def previousResult = currentBuild.previousBuild?.result
         if (previousResult != null && previousResult != currentResult) {
             echo 'State of the Pipeline has changed!'
         }
         echo 'Deleting directory...'
         deleteDir()
 }
}
