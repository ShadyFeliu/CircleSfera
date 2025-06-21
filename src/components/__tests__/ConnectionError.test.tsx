/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import '@testing-library/jest-dom';

// Tipos para los mocks
interface MockSocket {
  on: jest.Mock<any, any>;
  emit: jest.Mock<any, any>;
  disconnect: jest.Mock<any, any>;
}

const mockSocket: MockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('socket.io-client', () => {
  return jest.fn(() => mockSocket);
});

// Mock simple-peer
jest.mock('simple-peer', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    destroy: jest.fn(),
    connected: false,
  }));
});

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockRejectedValue(new Error('Media access denied')),
  },
  writable: true,
});

describe('ChatRoom Error Handling', () => {
  const defaultProps = {
    interests: 'música',
    ageFilter: '18-25'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows error message when media access is denied', async () => {
    render(<ChatRoom {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/No se pudo acceder a la cámara/)).toBeInTheDocument();
    });
  });

  test('shows connection error when socket fails', async () => {
    mockSocket.on.mockImplementation((event: string, callback: (data: { message: string; reconnectable: boolean }) => void) => {
      if (event === 'error') {
        callback({ message: 'Connection failed', reconnectable: false });
      }
    });

    render(<ChatRoom {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });

  test('shows banned message when user is banned', async () => {
    mockSocket.on.mockImplementation((event: string, callback: (data: { message: string }) => void) => {
      if (event === 'banned') {
        callback({ message: 'You have been banned' });
      }
    });

    render(<ChatRoom {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('You have been banned')).toBeInTheDocument();
    });
  });

  test('shows reconnection attempts for network errors', async () => {
    mockSocket.on.mockImplementation((event: string, callback: (data: { message: string; reconnectable: boolean }) => void) => {
      if (event === 'error') {
        callback({ message: 'Network error', reconnectable: true });
      }
    });

    render(<ChatRoom {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Reintentando conexión/)).toBeInTheDocument();
    });
  });

  test('shows reload button on max reconnection attempts', async () => {
    mockSocket.on.mockImplementation((event: string, callback: (data: { message: string; reconnectable: boolean }) => void) => {
      if (event === 'error') {
        callback({ message: 'Network error', reconnectable: true });
      }
    });

    render(<ChatRoom {...defaultProps} />);
    
    await waitFor(() => {
      const button = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent && btn.textContent.match(/Reiniciar/));
      expect(button).toBeInTheDocument();
    });
  });
});
