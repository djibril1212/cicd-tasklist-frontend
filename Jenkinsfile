pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        // Image Docker publiée sur Docker Hub
        IMAGE            = 'djibril1212/tasklist-frontend'
        // Réseau Docker partagé avec le conteneur SonarQube (résolution par nom)
        NET              = 'cicd'
        SONAR_HOST_URL   = 'http://sonarqube:9000'
        // Token SonarQube stocké dans les credentials Jenkins (jamais en clair)
        SONAR_TOKEN      = credentials('sonar-token-frontend')
        NODE_IMAGE       = 'node:20-alpine'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install & Tests (couverture)') {
            steps {
                sh '''
                    docker run --rm --network ${NET} \
                      -v "$PWD":/app -w /app ${NODE_IMAGE} \
                      sh -c "npm ci && npm run test:coverage"
                '''
            }
            post {
                always {
                    junit testResults: 'reports/junit.xml', allowEmptyResults: true
                    archiveArtifacts artifacts: 'coverage/lcov.info', allowEmptyArchive: true
                }
            }
        }

        stage('Build de production (Vite)') {
            steps {
                sh '''
                    docker run --rm --network ${NET} \
                      -v "$PWD":/app -w /app ${NODE_IMAGE} \
                      sh -c "npm run build"
                '''
                archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true
            }
        }

        stage('Analyse SonarQube') {
            steps {
                sh '''
                    docker run --rm --network ${NET} \
                      -e SONAR_HOST_URL=${SONAR_HOST_URL} \
                      -e SONAR_TOKEN=${SONAR_TOKEN} \
                      -v "$PWD":/usr/src \
                      sonarsource/sonar-scanner-cli
                '''
            }
        }

        stage('Build image Docker (Nginx)') {
            steps {
                sh 'docker build -t ${IMAGE}:${BUILD_NUMBER} -t ${IMAGE}:latest .'
            }
        }

        stage('Scan Trivy (CRITICAL,HIGH)') {
            steps {
                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v "$HOME/.cache/trivy":/root/.cache/ \
                      aquasec/trivy:latest image \
                      --scanners vuln --severity CRITICAL,HIGH --exit-code 0 \
                      ${IMAGE}:latest
                '''
            }
        }

        stage('SBOM (SPDX)') {
            steps {
                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v "$HOME/.cache/trivy":/root/.cache/ \
                      -v "$PWD":/out \
                      aquasec/trivy:latest image \
                      --format spdx-json --output /out/sbom-spdx.json \
                      ${IMAGE}:latest
                '''
                archiveArtifacts artifacts: 'sbom-spdx.json', fingerprint: true
            }
        }

        stage('Publication Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub',
                    usernameVariable: 'DH_USER',
                    passwordVariable: 'DH_PASS')]) {
                    sh '''
                        echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
                        docker push ${IMAGE}:${BUILD_NUMBER}
                        docker push ${IMAGE}:latest
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
