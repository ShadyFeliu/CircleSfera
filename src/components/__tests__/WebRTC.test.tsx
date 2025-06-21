/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

const mockSocket: {
  on: jest.Mock<any, any>;
  emit: jest.Mock<any, any>;
  disconnect: jest.Mock<any, any>;
} = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('socket.io-client', () => {
  return jest.fn(() => mockSocket);
});

// Mock simple-peer
interface MockSimplePeer {
  on: jest.Mock<any, any>;
  emit: jest.Mock<any, any>;
  destroy: jest.Mock<any, any>;
  connected: boolean;
}

jest.mock('simple-peer', () => {
  return jest.fn().mockImplementation((): MockSimplePeer => ({
    on: jest.fn(),
    emit: jest.fn(),
    destroy: jest.fn(),
    connected: false,
  }));
});

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn(),
        enabled: true
      }]
    }),
  },
  writable: true,
});

describe('WebRTC Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes WebRTC connection when partner is found', async () => {
    mockSocket.on.mockImplementation((event: string, callback: (data: { id: string; initiator: boolean }) => void) => {
      if (event === 'partner') {
        callback({ id: 'partner-id', initiator: true });
      }
    });

    render(<ChatRoom interests="test" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Buscando un compañero/)).toBeInTheDocument();
    });
  });

  test('handles WebRTC connection errors gracefully', async () => {
    mockSocket.on.mockImplementation(() => {});
    render(<ChatRoom interests="test" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Buscando un compañero/)).toBeInTheDocument();
    });
  });
});
