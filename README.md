# CircleSfera - Chat de Video Aleatorio

CircleSfera es una plataforma de chat por video que permite a los usuarios conectarse aleatoriamente con personas de todo el mundo basándose en intereses comunes.

## 🚀 Características

- 💬 Chat de video en tiempo real con WebRTC
- 🎯 Emparejamiento basado en intereses
- 🔒 Filtrado por edad para mayor seguridad
- 📱 Diseño responsive
- 🎨 Filtros de video en tiempo real
- 📷 Compartir imágenes
- 🎥 Grabación de pantalla
- 🌍 Estadísticas de uso
- 📊 Monitoreo de rendimiento
- 🛡️ Sistema de reportes y moderación

## 🛠️ Tecnologías

- Next.js 14 con TypeScript
- Tailwind CSS para estilos
- Socket.IO para comunicación en tiempo real
- Simple-Peer para conexiones WebRTC
- WebRTC para streaming de audio/video

## 📋 Requisitos Previos

- Node.js ≥ 18.0.0
- npm o pnpm
- WebCam y micrófono

## 🚀 Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/ShadyFeliu/CircleSfera.git
   cd CircleSfera
   ```

2. Instalar dependencias:
   ```bash
   npm install
   # o
   pnpm install
   ```

3. Crear archivo .env.local:
   ```
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   NEXT_PUBLIC_ANALYTICS_ID=
   NEXT_PUBLIC_ENABLE_SCREEN_RECORDING=true
   NEXT_PUBLIC_ENABLE_FILE_SHARING=true
   ```

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   pnpm dev
   ```

## 🔧 Configuración

### Servidor de Señalización

El backend debe estar corriendo para que funcione la aplicación. Ver [CircleSfera-Backend](https://github.com/ShadyFeliu/CircleSfera-Backend) para instrucciones de configuración.

### Variables de Entorno

- `NEXT_PUBLIC_SOCKET_URL`: URL del servidor de señalización
- `NEXT_PUBLIC_ANALYTICS_ID`: ID para análisis (opcional)
- `NEXT_PUBLIC_ENABLE_SCREEN_RECORDING`: Habilitar grabación de pantalla
- `NEXT_PUBLIC_ENABLE_FILE_SHARING`: Habilitar compartir archivos

## 📦 Estructura del Proyecto

```
src/
├── app/               # Rutas y layouts de Next.js
├── components/        # Componentes React
├── hooks/            # Custom hooks
├── utils/            # Utilidades
└── styles/           # Estilos globales
```

## 🔒 Seguridad

- Filtrado de edad para proteger a menores
- Sistema de reportes para contenido inapropiado
- Encriptación de extremo a extremo para video/audio
- Rate limiting y protección contra abusos
- Headers de seguridad configurados

## 📈 Monitoreo

La aplicación incluye:
- Métricas de rendimiento
- Estadísticas de uso
- Monitoreo de calidad de conexión WebRTC
- Logs de errores y eventos

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **ShadyFeliu** - *Trabajo inicial*

## 🙏 Agradecimientos

- Simple-Peer por la biblioteca WebRTC
- Socket.IO por la comunicación en tiempo real
- Tailwind CSS por el sistema de estilos

# CircleSfera Backend 🚀

Servidor de señalización para la aplicación CircleSfera, construido con Node.js, TypeScript y Socket.IO.

## 🎯 Características

- **WebSocket en tiempo real** con Socket.IO
- **Emparejamiento inteligente** por intereses
- **Sistema de moderación** con reportes y baneos
- **Filtros de edad** para mayor seguridad
- **Contador de usuarios** online
- **CORS configurado** para producción

## 🚀 Despliegue

### Heroku
```bash
# Crear app en Heroku
heroku create circlesfera-api

# Configurar dominio personalizado
heroku domains:add api.circlesfera.com

# Desplegar
git push heroku main
```

### Variables de Entorno
```bash
PORT=3001  # Puerto del servidor
```

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Construir
npm run build

# Producción
npm start
```

## 📡 Endpoints

- **WebSocket**: `ws://localhost:3001`
- **Health Check**: `GET /health`

## 🔧 Configuración CORS

El servidor está configurado para aceptar conexiones desde:
- `https://circlesfera.com`
- `https://www.circlesfera.com`
- `https://circlesfera.vercel.app`
- `http://localhost:3000` (desarrollo)

## 📊 Funcionalidades

### Emparejamiento
- Colas múltiples por intereses
- Filtros de edad
- Emparejamiento inteligente

### Moderación
- Sistema de reportes
- Baneo automático por múltiples reportes
- Limpieza automática de usuarios desconectados

### Estadísticas
- Contador de usuarios online
- Logs de conexiones/desconexiones

## 🔗 Conexión con Frontend

El frontend debe configurar la variable de entorno:
```
NEXT_PUBLIC_SOCKET_URL=https://api.circlesfera.com
```

## 📄 Licencia

MIT

<!-- Redeploy forzado para limpiar caché - $(date) -->