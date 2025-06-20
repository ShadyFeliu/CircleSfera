# CircleSfera 🌍

Una aplicación de videochat en tiempo real inspirada en Omegle y ChatRoulette, construida con Next.js, TypeScript y WebRTC.

## ✨ Características Principales

### 🎥 Videochat en Tiempo Real
- **Conexión P2P**: Comunicación directa entre usuarios usando WebRTC
- **Calidad Adaptativa**: Indicador de calidad de conexión en tiempo real
- **Controles de Audio/Video**: Silenciar micrófono y activar/desactivar cámara
- **Filtros de Video**: Efectos visuales (B&N, Sepia, Invertir)

### 💬 Chat Avanzado
- **Mensajes de Texto**: Chat en tiempo real con indicador de "escribiendo"
- **Emojis**: Selector de emojis integrado
- **Compartir Imágenes**: Envío de imágenes en el chat
- **Timestamps**: Hora exacta de cada mensaje
- **Notificaciones de Sonido**: Alertas cuando llegan mensajes

### 🤝 Emparejamiento Inteligente
- **Intereses**: Emparejamiento basado en intereses comunes
- **Filtros de Edad**: Opciones de filtrado por rango de edad
- **Colas Múltiples**: Sistema de colas separadas por intereses
- **Botón "Siguiente"**: Cambiar de pareja instantáneamente

### 📊 Estadísticas y Social
- **Contador de Usuarios**: Número de usuarios online en tiempo real
- **Estadísticas Personales**: Historial de chats, tiempo total, países visitados
- **Intereses Favoritos**: Sistema de intereses más usados
- **Compartir App**: Integración con Web Share API
- **Feedback**: Enlace directo para comentarios

### 🛡️ Moderación y Seguridad
- **Sistema de Reportes**: Reportar usuarios inapropiados
- **Baneo Automático**: Suspensión temporal por múltiples reportes
- **Filtros de Edad**: Control parental y seguridad
- **Privacidad**: No se graban conversaciones

### 🎬 Funcionalidades Avanzadas
- **Grabación de Pantalla**: Grabar tu pantalla durante el chat
- **Indicadores Visuales**: Estado del compañero (silenciado, video off)
- **Animaciones**: Interfaz fluida con transiciones suaves
- **Responsive**: Diseño adaptativo para móviles y desktop

## 🚀 Tecnologías Utilizadas

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.IO
- **WebRTC**: Simple-Peer para conexiones P2P
- **Estado**: React Hooks, localStorage
- **Animaciones**: CSS personalizado, Tailwind

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/CircleSfera.git
   cd CircleSfera
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear .env.local si es necesario
   echo "PORT=3001" > .env.local
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Ejecutar servidor de señalización**
   ```bash
   npm run server
   ```

## 🎯 Uso

### Para Usuarios
1. **Acceder**: Abrir `http://localhost:3000`
2. **Configurar**: Añadir intereses y filtro de edad
3. **Conectar**: Hacer clic en "Buscar Chat"
4. **Chatear**: Usar controles de audio/video y chat
5. **Navegar**: Usar "Siguiente" para cambiar de pareja

### Funcionalidades Clave
- **🔊 Silenciar/Desilenciar**: Control de audio
- **📷 Video On/Off**: Control de cámara
- **😀 Emojis**: Expresar emociones
- **📷 Compartir Imágenes**: Enviar fotos
- **🎥 Grabar Pantalla**: Capturar pantalla
- **📊 Estadísticas**: Ver tu actividad
- **🛡️ Reportar**: Moderar contenido

## 🔧 Configuración Avanzada

### Servidor de Producción
```bash
# Construir para producción
npm run build

# Ejecutar servidor de producción
npm start
```

### Configuración de Red
Para acceso desde otros dispositivos en la red local:
```bash
# Ejecutar Next.js con host 0.0.0.0
npm run dev -- -H 0.0.0.0
```

### Configuración de CORS
Actualizar `server.ts` con tu IP local:
```typescript
cors: {
  origin: ["http://localhost:3000", "http://TU_IP:3000"],
  methods: ["GET", "POST"]
}
```

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

### Dispositivos
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Móviles (iOS Safari, Chrome Mobile)
- ✅ Tablets

### Requisitos
- 📹 Cámara web
- 🎤 Micrófono
- 🌐 Conexión a internet estable
- 🔒 HTTPS (para producción)

## 🛠️ Desarrollo

### Estructura del Proyecto
```
CircleSfera/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/
│       ├── ChatRoom.tsx
│       ├── Stats.tsx
│       ├── ScreenRecorder.tsx
│       └── Notification.tsx
├── server.ts
├── package.json
└── README.md
```

### Scripts Disponibles
- `npm run dev`: Desarrollo frontend
- `npm run server`: Servidor de señalización
- `npm run dev:full`: Ambos servidores
- `npm run build`: Construcción para producción
- `npm start`: Servidor de producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Simple-Peer](https://github.com/feross/simple-peer) - Biblioteca WebRTC
- [Socket.IO](https://socket.io/) - Comunicación en tiempo real
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Next.js](https://nextjs.org/) - Framework React

## 📞 Soporte

Si tienes problemas o preguntas:
- 📧 Email: tu-email@ejemplo.com
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/CircleSfera/issues)
- 💬 Discord: [Servidor de la comunidad](https://discord.gg/tu-servidor)

---

**¡Disfruta chateando con gente de todo el mundo en CircleSfera! 🌍✨**