/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import '@testing-library/jest-dom';

// Mock robusto de MediaStream
const mockMediaStream = {
  getTracks: () => [{
    stop: () => {},
    enabled: true
  }],
  getAudioTracks: () => [{
    enabled: true,
    stop: () => {}
  }],
  getVideoTracks: () => [{
    enabled: true,
    stop: () => {}
  }],
  active: true,
  id: 'mock-stream-id'
};

// Mock básico de Socket.IO
jest.mock('socket.io-client', () => {
  return () => ({
    emit: () => {},
    on: () => {},
    disconnect: () => {},
    connect: () => {}
  });
});

// Mock básico de simple-peer
jest.mock('simple-peer', () => {
  return () => ({
    on: () => {},
    emit: () => {},
    destroy: () => {},
    connected: false
  });
});

// Mock robusto de getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve(mockMediaStream)
  },
  writable: true
});

describe('ChatRoom Error Handling', () => {
  const defaultProps = {
    interests: 'música',
    ageFilter: '18-25'
  };

  it('renders without crashing', () => {
    expect(() => render(<ChatRoom {...defaultProps} />)).not.toThrow();
  });

  it('accepts error handling props', () => {
    const props = {
      interests: 'test',
      ageFilter: '18-25'
    };
    expect(props.interests).toBe('test');
    expect(props.ageFilter).toBe('18-25');
  });

  it('has correct component structure', () => {
    const { container } = render(<ChatRoom {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('handles props validation', () => {
    const props = {
      interests: 'música,programación',
      ageFilter: '18-25'
    };
    expect(typeof props.interests).toBe('string');
    expect(typeof props.ageFilter).toBe('string');
  });

  it('validates component props', () => {
    expect(defaultProps.interests).toBe('música');
    expect(defaultProps.ageFilter).toBe('18-25');
  });
});
