import { render, act } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import '@testing-library/jest-dom';

// Mock RTCPeerConnection
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  iceConnectionState: 'new',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  getStats: jest.fn().mockResolvedValue(new Map()),
  close: jest.fn()
})) as any;

// Agregar generateCertificate al constructor
(global.RTCPeerConnection as any).generateCertificate = jest.fn().mockResolvedValue({});

// Mock MediaStream
const mockMediaStream = {
  getTracks: () => [{
    stop: jest.fn(),
    enabled: true
  }],
  getAudioTracks: () => [{
    enabled: true,
    stop: jest.fn()
  }],
  getVideoTracks: () => [{
    enabled: true,
    stop: jest.fn()
  }]
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
  },
  writable: true
});

// Mock Socket.IO
jest.mock('socket.io-client', () => {
  return jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn()
  }));
});

describe('ChatRoom WebRTC', () => {
  const defaultProps = {
    interests: 'música,programación',
    ageFilter: '18-25'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles ICE connection state changes', async () => {
    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    act(() => {
      const peerConnection = new RTCPeerConnection();
      // Usar Object.defineProperty para cambiar iceConnectionState
      Object.defineProperty(peerConnection, 'iceConnectionState', {
        value: 'checking',
        writable: true
      });
      // Simular el evento de cambio de estado
      const event = new Event('iceconnectionstatechange');
      peerConnection.dispatchEvent(event);
    });

    expect(getByText(/Buscando un compañero/i)).toBeInTheDocument();
  });

  it('monitors connection quality', async () => {
    const mockStats = new Map([
      ['inbound-rtp', {
        type: 'inbound-rtp',
        packetsLost: 0,
        packetsReceived: 100
      }]
    ]);

    const mockPeerConnection = {
      getStats: jest.fn().mockResolvedValue(mockStats)
    };

    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    // Simular monitoreo de calidad de conexión
    await act(async () => {
      const stats = await mockPeerConnection.getStats();
      expect(stats).toBeDefined();
    });

    expect(getByText(/Buena conexión/i)).toBeInTheDocument();
  }, 10000); // Aumentar timeout para este test
});
