io.on("connection", (socket) => {
  const ip = socket.handshake.address;
  const userAgent = socket.handshake.headers['user-agent'] || '';

  socket.on("find_partner", async ({ interests, deviceId: clientDeviceId }: { interests: string[]; deviceId?: string }) => {
    const deviceId = clientDeviceId || `${ip}|${userAgent}`;
    socketToDeviceId.set(socket.id, deviceId);
    deviceSet.add(deviceId);
    log(`[Conexión] deviceId añadido: ${deviceId} para socket ${socket.id}`);
    log(`[Conexión] deviceId recibido del cliente: ${clientDeviceId || 'NO ENVIADO'}`);
    log(`[Conexión] deviceId generado por servidor: ${clientDeviceId ? 'NO APLICABLE' : `${ip}|${userAgent}`}`);
    log(`[Conexión] Total deviceSet después de añadir: ${deviceSet.size}`);
    log(`[Conexión] Contenido del deviceSet: ${Array.from(deviceSet).join(', ')}`);
    logEstadoEmparejamiento('find_partner');
    userInterests.set(socket.id, interests || []);
    await findPartnerFor(socket.id);
    setTimeout(checkAutoPairing, 1000);
  });

// ... existing code ... 