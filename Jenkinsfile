pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        // Image Docker publiée sur Docker Hub
        IMAGE          = 'djibril1212/tasklist-frontend'
        // Réseau Docker partagé avec le conteneur SonarQube (résolution par nom)
        NET            = 'cicd'
        SONAR_HOST_URL = 'http://sonarqube:9000'
        // Token SonarQube : credential Jenkins, jamais en clair dans le code
        SONAR_TOKEN    = credentials('sonar-token-frontend')
        // Images d'outils épinglées (pas de tag flottant)
        NODE_IMAGE     = 'node:20-alpine'
        SCANNER_IMAGE  = 'sonarsource/sonar-scanner-cli:11'
        TRIVY_IMAGE    = 'aquasec/trivy:0.66.0'
        // Jenkins tourne en conteneur : on partage son workspace (volume nommé)
        // avec les conteneurs d'outils via --volumes-from.
        DOCKER_WS      = "--volumes-from ${env.HOSTNAME} -w ${env.WORKSPACE}"
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install & Tests (couverture)') {
            steps {
                sh '''
                    docker run --rm ${DOCKER_WS} --network ${NET} ${NODE_IMAGE} \
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
                    docker run --rm ${DOCKER_WS} --network ${NET} ${NODE_IMAGE} \
                      sh -c "npm run build"
                '''
                archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true
            }
        }

        stage('Analyse SonarQube') {
            steps {
                // -e SONAR_TOKEN (sans '=') : la valeur est passée depuis
                // l'environnement, jamais écrite sur la ligne de commande (argv).
                sh '''
                    docker run --rm ${DOCKER_WS} --network ${NET} \
                      -e SONAR_HOST_URL=${SONAR_HOST_URL} \
                      -e SONAR_TOKEN \
                      ${SCANNER_IMAGE}
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
                // 1) Rapport lisible CRITICAL+HIGH (n'échoue pas)
                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v "$HOME/.cache/trivy":/root/.cache/ \
                      ${TRIVY_IMAGE} image \
                      --scanners vuln --severity CRITICAL,HIGH --exit-code 0 \
                      ${IMAGE}:latest
                '''
                // 2) Gate de sécurité : le build ÉCHOUE si une CRITICAL est trouvée
                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v "$HOME/.cache/trivy":/root/.cache/ \
                      ${TRIVY_IMAGE} image \
                      --scanners vuln --severity CRITICAL --exit-code 1 --quiet \
                      ${IMAGE}:latest
                '''
            }
        }

        stage('SBOM (SPDX)') {
            steps {
                sh '''
                    docker run --rm ${DOCKER_WS} \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v "$HOME/.cache/trivy":/root/.cache/ \
                      ${TRIVY_IMAGE} image \
                      --format spdx-json --output ${WORKSPACE}/sbom-spdx.json \
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
                    // login via stdin : le secret ne passe pas par argv
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
