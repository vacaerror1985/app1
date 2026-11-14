// Pipeline multibranch de app1
//  - Ramas feature/* y pull requests: construye la imagen y la prueba (no despliega)
//  - Rama main (después de aprobar el PR): versiona, despliega en 10.0.0.238 y crea el tag vX.Y.Z en GitHub
pipeline {
    agent any

    environment {
        IMAGEN     = 'app1'
        CONTENEDOR = 'app1'
        PUERTO     = '3000'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '15'))
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Obtener código de GitHub') {
            steps {
                checkout scm
            }
        }

        stage('Calcular versión') {
            steps {
                script {
                    // MAYOR.MENOR viene de package.json; el PARCHE es el número de build
                    def base = sh(returnStdout: true,
                        script: "sed -n 's/.*\"version\": *\"\\([0-9]*\\.[0-9]*\\).*/\\1/p' package.json").trim()
                    if (env.BRANCH_NAME == 'main') {
                        env.VERSION = "${base}.${env.BUILD_NUMBER}"
                    } else {
                        def rama = env.BRANCH_NAME.replaceAll('[^A-Za-z0-9_.-]', '-').toLowerCase()
                        env.VERSION = "${base}.0-${rama}.${env.BUILD_NUMBER}"
                    }
                    currentBuild.displayName = "#${env.BUILD_NUMBER} v${env.VERSION}"
                    echo "Versión: ${env.VERSION}"
                }
            }
        }

        stage('Construir imagen Docker') {
            steps {
                sh 'docker build -t ${IMAGEN}:${VERSION} .'
            }
        }

        stage('Probar imagen') {
            steps {
                sh '''
                    PRUEBA=${CONTENEDOR}-prueba-${BUILD_TAG}
                    PRUEBA=$(echo "$PRUEBA" | tr -c 'A-Za-z0-9_.-' '-')
                    docker run -d --name "$PRUEBA" ${IMAGEN}:${VERSION}
                    OK=1
                    for i in $(seq 1 10); do
                        if docker exec "$PRUEBA" wget -qO- http://localhost:3000/api/usuarios > /dev/null 2>&1; then
                            OK=0; break
                        fi
                        sleep 2
                    done
                    [ $OK -eq 0 ] || docker logs "$PRUEBA"
                    docker rm -f "$PRUEBA" > /dev/null
                    exit $OK
                '''
            }
        }

        stage('Desplegar en 10.0.0.238') {
            when { branch 'main' }
            steps {
                sh '''
                    docker tag ${IMAGEN}:${VERSION} ${IMAGEN}:latest
                    docker rm -f ${CONTENEDOR} 2>/dev/null || true
                    docker run -d --name ${CONTENEDOR} --restart unless-stopped \
                        -p ${PUERTO}:3000 ${IMAGEN}:${VERSION}
                    for i in $(seq 1 10); do
                        if curl -fs http://localhost:${PUERTO}/ > /dev/null; then
                            echo "v${VERSION} disponible en http://10.0.0.238:${PUERTO}"
                            exit 0
                        fi
                        sleep 2
                    done
                    docker logs ${CONTENEDOR}
                    exit 1
                '''
            }
        }

        stage('Crear tag de versión en GitHub') {
            when { branch 'main' }
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-token',
                        usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                    sh '''
                        git config user.name  "Jenkins"
                        git config user.email "jenkins@10.0.0.238"
                        git tag -a "v${VERSION}" -m "Release v${VERSION} (build ${BUILD_NUMBER})"
                        REPO=$(git config --get remote.origin.url | sed 's#https://##')
                        git push "https://${GH_USER}:${GH_TOKEN}@${REPO}" "v${VERSION}"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Build v${env.VERSION} correcto en la rama ${env.BRANCH_NAME}"
        }
        failure {
            echo 'El pipeline falló, revisa los logs de la etapa con error.'
        }
        always {
            sh 'docker image prune -f > /dev/null || true'
        }
    }
}
