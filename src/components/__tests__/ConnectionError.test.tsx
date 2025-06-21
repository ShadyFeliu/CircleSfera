import { render, fireEvent, waitFor, act } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import '@testing-library/jest-dom';

// Mock Socket.IO
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connect: jest.fn()
};

jest.mock('socket.io-client', () => jest.fn(() => mockSocket));

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

describe('ChatRoom Error Handling', () => {
  const defaultProps = {
    interests: 'música',
    ageFilter: '18-25'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
  });

  it('shows connection error message when WebSocket fails', async () => {
    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    // Simular error de conexión
    const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'error')?.[1];
    if (errorCallback) {
      await act(async () => {
        errorCallback({ message: 'Connection failed', reconnectable: false });
      });
    }
    
    await waitFor(() => {
      expect(getByText('Error de Conexión')).toBeInTheDocument();
    });
  });

  it('shows banned message when user is banned', async () => {
    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    // Simular evento de baneo
    const bannedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'banned')?.[1];
    if (bannedCallback) {
      await act(async () => {
        bannedCallback({ message: 'You have been banned' });
      });
    }
    
    await waitFor(() => {
      expect(getByText('You have been banned')).toBeInTheDocument();
    });
  });

  it('attempts reconnection on recoverable errors', async () => {
    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    // Simular error recuperable
    const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'error')?.[1];
    if (errorCallback) {
      await act(async () => {
        errorCallback({ message: 'Network error', reconnectable: true });
      });
    }
    
    await waitFor(() => {
      expect(getByText(/Reintentando conexión/i)).toBeInTheDocument();
    });
  });

  it('shows reload button on max reconnection attempts', async () => {
    const { container, rerender } = render(<ChatRoom {...defaultProps} />);
    
    // Simular el máximo de intentos de reconexión (4 según la lógica del componente)
    const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'error')?.[1];
    if (errorCallback) {
      await act(async () => {
        for (let i = 0; i < 4; i++) {
          errorCallback({ message: 'Network error', reconnectable: true });
        }
      });
    }
    // Forzar re-render
    rerender(<ChatRoom {...defaultProps} />);
    
    await waitFor(() => {
      const button = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.match(/Reiniciar/));
      expect(button).toBeInTheDocument();
    });
  });
});
