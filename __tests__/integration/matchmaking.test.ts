import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { io as socketIOClient } from 'socket.io-client';
import { AddressInfo } from 'net';

describe('Matchmaking Integration Tests', () => {
  let io: Server;
  let httpServer: any;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);

    // Lógica mejorada de matchmaking para pruebas
    io.on('connection', (socket: Socket) => {
      socket.data = { requests: 0, interests: [], age: null, ageFilter: null, matched: false };
      
      socket.on('find_partner', (data: any) => {
        // Rate limiting
        socket.data.requests++;
        if (socket.data.requests > 10) {
          socket.emit('error', { message: 'Rate limit exceeded' });
          return;
        }

        // Si ya está emparejado, no buscar más
        if (socket.data.matched) return;

        // Guardar datos del usuario
        socket.data = { ...socket.data, ...data };
        
        // Buscar pareja compatible
        const connectedSockets = Array.from(io.sockets.sockets.values()) as Socket[];
        const otherSocket = connectedSockets.find((s: Socket) => {
          if (s.id === socket.id || s.data.matched) return false;
          
          // Verificar intereses
          if (data.interests && s.data.interests) {
            const hasCommonInterests = data.interests.some((interest: string) => 
              s.data.interests.includes(interest)
            );
            if (!hasCommonInterests) return false;
          }
          
          // Verificar filtros de edad
          if (data.ageFilter && s.data.ageFilter) {
            if (data.ageFilter !== s.data.ageFilter) return false;
          }
          
          return true;
        });

        if (otherSocket) {
          socket.data.matched = true;
          otherSocket.data.matched = true;
          socket.emit('partner', { id: otherSocket.id });
          otherSocket.emit('partner', { id: socket.id });
        }
      });

      // Manejo de desconexión
      socket.on('disconnect', () => {
        io.emit('partner_disconnected', { id: socket.id });
      });
    });

    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
  });

  test('empareja usuarios con intereses similares', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    const user2 = socketIOClient(`http://localhost:${port}`);
    const intereses = ['música', 'programación'];
    let matchCount = 0;
    const checkDone = () => {
      matchCount++;
      if (matchCount === 2) {
        user1.disconnect();
        user2.disconnect();
        done();
      }
    };
    user1.on('connect', () => user1.emit('find_partner', { interests: intereses }));
    user2.on('connect', () => user2.emit('find_partner', { interests: intereses }));
    user1.on('partner', (data: any) => { expect(data.id).toBe(user2.id); checkDone(); });
    user2.on('partner', (data: any) => { expect(data.id).toBe(user1.id); checkDone(); });
  });

  test('respeta los filtros de edad', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    const user2 = socketIOClient(`http://localhost:${port}`);
    user1.on('connect', () => user1.emit('find_partner', { interests: ['música'], age: 20, ageFilter: '18-25' }));
    user2.on('connect', () => user2.emit('find_partner', { interests: ['música'], age: 30, ageFilter: '26-35' }));
    let emparejado = false;
    user1.on('partner', () => { emparejado = true; });
    user2.on('partner', () => { emparejado = true; });
    setTimeout(() => {
      expect(emparejado).toBe(false);
      user1.disconnect();
      user2.disconnect();
      done();
    }, 500);
  });

  test('maneja la desconexión correctamente', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    const user2 = socketIOClient(`http://localhost:${port}`);
    let user1Id: string;
    
    user1.on('connect', () => {
      user1Id = user1.id;
      user1.emit('find_partner', { interests: ['música'] });
    });
    user2.on('connect', () => user2.emit('find_partner', { interests: ['música'] }));
    
    user2.on('partner', () => {
      user1.disconnect();
    });
    
    user2.on('partner_disconnected', (data: any) => {
      expect(data.id).toBe(user1Id);
      user2.disconnect();
      done();
    });
  });

  test('aplica rate limiting', (done) => {
    const user = socketIOClient(`http://localhost:${port}`);
    let errorReceived = false;
    user.on('connect', () => {
      for (let i = 0; i < 15; i++) {
        user.emit('find_partner', { interests: ['test'] });
      }
    });
    user.on('error', (data: any) => {
      expect(data.message).toContain('Rate limit exceeded');
      errorReceived = true;
    });
    setTimeout(() => {
      expect(errorReceived).toBe(true);
      user.disconnect();
      done();
    }, 300);
  });

  test('empareja en orden de llegada', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    const user2 = socketIOClient(`http://localhost:${port}`);
    const user3 = socketIOClient(`http://localhost:${port}`);
    const intereses = ['música'];
    let user1Matched = false;
    let user2Matched = false;
    let user3Matched = false;
    
    user1.on('connect', () => user1.emit('find_partner', { interests: intereses }));
    user2.on('connect', () => user2.emit('find_partner', { interests: intereses }));
    user3.on('connect', () => user3.emit('find_partner', { interests: intereses }));
    
    user1.on('partner', () => { user1Matched = true; });
    user2.on('partner', () => { user2Matched = true; });
    user3.on('partner', () => { user3Matched = true; });
    
    setTimeout(() => {
      expect(user1Matched).toBe(true);
      expect(user2Matched).toBe(true);
      expect(user3Matched).toBe(false); // El tercero queda esperando
      user1.disconnect();
      user2.disconnect();
      user3.disconnect();
      done();
    }, 1000);
  });

  test('empareja correctamente con múltiples intereses', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    const user2 = socketIOClient(`http://localhost:${port}`);
    const user3 = socketIOClient(`http://localhost:${port}`);
    user1.on('connect', () => user1.emit('find_partner', { interests: ['música', 'programación'] }));
    user2.on('connect', () => user2.emit('find_partner', { interests: ['música', 'viajes'] }));
    user3.on('connect', () => user3.emit('find_partner', { interests: ['programación', 'viajes'] }));
    let matchCount = 0;
    const matches = new Set();
    const checkMatch = (userId: string, partnerId: string) => {
      matches.add(`${userId}-${partnerId}`);
      matchCount++;
      if (matchCount === 2) {
        expect(matches.size).toBe(2); // Dos pares únicos
        user1.disconnect();
        user2.disconnect();
        user3.disconnect();
        done();
      }
    };
    user1.on('partner', (data: any) => checkMatch('user1', data.id));
    user2.on('partner', (data: any) => checkMatch('user2', data.id));
    user3.on('partner', (data: any) => checkMatch('user3', data.id));
  });

  test('maneja reintentos de reconexión', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    let reconnectAttempts = 0;
    
    user1.on('connect', () => {
      if (reconnectAttempts < 3) {
        setTimeout(() => user1.disconnect(), 100);
      } else {
        expect(user1.connected).toBe(true);
        user1.disconnect();
        done();
      }
    });
    
    user1.on('disconnect', () => {
      reconnectAttempts++;
      if (reconnectAttempts < 3) {
        setTimeout(() => user1.connect(), 100);
      }
    });
  });

  test('limpia correctamente las colas tras desconexión', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    const user2 = socketIOClient(`http://localhost:${port}`);
    
    user1.on('connect', () => {
      user1.emit('find_partner', { interests: ['música', 'programación'] });
      setTimeout(() => {
        user1.disconnect();
        user2.emit('find_partner', { interests: ['música'] });
      }, 200);
    });
    
    let emparejado = false;
    user2.on('partner', () => { emparejado = true; });
    
    setTimeout(() => {
      expect(emparejado).toBe(false);
      user2.disconnect();
      done();
    }, 1000);
  });

  test('valida datos de entrada', (done) => {
    const user = socketIOClient(`http://localhost:${port}`);
    user.on('connect', () => {
      user.emit('find_partner', { interests: [] });
      user.emit('find_partner', { interests: null });
      user.emit('find_partner', {});
      user.emit('find_partner');
    });
    
    let emparejado = false;
    user.on('partner', () => { emparejado = true; });
    
    setTimeout(() => {
      expect(emparejado).toBe(false);
      user.disconnect();
      done();
    }, 500);
  });

  test('maneja múltiples solicitudes del mismo usuario', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    const user2 = socketIOClient(`http://localhost:${port}`);
    let matchCount = 0;
    
    user1.on('connect', () => {
      user1.emit('find_partner', { interests: ['música'] });
      user1.emit('find_partner', { interests: ['música'] });
      user1.emit('find_partner', { interests: ['música'] });
    });
    user2.on('connect', () => user2.emit('find_partner', { interests: ['música'] }));
    
    user1.on('partner', () => { matchCount++; });
    user2.on('partner', () => { matchCount++; });
    
    setTimeout(() => {
      expect(matchCount).toBe(2);
      user1.disconnect();
      user2.disconnect();
      done();
    }, 500);
  });

  test('maneja reconexión de usuarios', (done) => {
    const user1 = socketIOClient(`http://localhost:${port}`);
    const user2 = socketIOClient(`http://localhost:${port}`);
    let reconnectAttempts = 0;
    
    user1.on('connect', () => {
      if (reconnectAttempts < 2) {
        setTimeout(() => user1.disconnect(), 100);
      } else {
        user1.emit('find_partner', { interests: ['música'] });
      }
    });
    
    user1.on('disconnect', () => {
      reconnectAttempts++;
      if (reconnectAttempts < 2) {
        setTimeout(() => user1.connect(), 100);
      }
    });
    
    user2.on('connect', () => user2.emit('find_partner', { interests: ['música'] }));
    
    let matchCount = 0;
    const checkDone = () => {
      matchCount++;
      if (matchCount === 2) {
        user1.disconnect();
        user2.disconnect();
        done();
      }
    };
    
    user1.on('partner', (data: any) => { expect(data.id).toBe(user2.id); checkDone(); });
    user2.on('partner', (data: any) => { expect(data.id).toBe(user1.id); checkDone(); });
  });
}); 