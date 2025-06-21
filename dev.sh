#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print colored output
print() {
    echo -e "${2}${1}${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print "🚫 Docker no está corriendo. Por favor, inicia Docker primero." "$RED"
        exit 1
    fi
}

# Function to show help
show_help() {
    print "\n🚀 CircleSfera - Script de Desarrollo" "$BLUE"
    print "\nComandos disponibles:" "$GREEN"
    print "  start      - Inicia los contenedores de desarrollo"
    print "  stop       - Detiene los contenedores"
    print "  logs       - Muestra los logs de los contenedores"
    print "  restart    - Reinicia los contenedores"
    print "  clean      - Limpia contenedores y builds"
    print "  test       - Ejecuta los tests"
    print "  build      - Construye las imágenes de producción"
    print "  help       - Muestra esta ayuda\n"
}

# Start development environment
start_dev() {
    print "🚀 Iniciando entorno de desarrollo..." "$BLUE"
    docker-compose up -d
    print "✅ Entorno iniciado! Accede a:" "$GREEN"
    print "   Frontend: http://localhost:3000" "$GREEN"
    print "   Backend: http://localhost:3001" "$GREEN"
}

# Stop containers
stop_dev() {
    print "🛑 Deteniendo contenedores..." "$BLUE"
    docker-compose down
}

# Show logs
show_logs() {
    print "📋 Mostrando logs..." "$BLUE"
    docker-compose logs -f
}

# Clean environment
clean_env() {
    print "🧹 Limpiando entorno..." "$BLUE"
    docker-compose down -v
    rm -rf .next
    rm -rf node_modules
    print "✅ Entorno limpiado!" "$GREEN"
}

# Run tests
run_tests() {
    print "🧪 Ejecutando tests..." "$BLUE"
    docker-compose exec web npm test
}

# Build production images
build_prod() {
    print "🏗️ Construyendo imágenes de producción..." "$BLUE"
    docker build -t circlesfera-frontend:prod .
    print "✅ Build completado!" "$GREEN"
}

# Main script logic
check_docker

case "$1" in
    "start")
        start_dev
        ;;
    "stop")
        stop_dev
        ;;
    "logs")
        show_logs
        ;;
    "restart")
        stop_dev
        start_dev
        ;;
    "clean")
        clean_env
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_prod
        ;;
    "help"|*)
        show_help
        ;;
esac
