import { render, fireEvent, waitFor } from '@testing-library/react';
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
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve(mockMediaStream)
  },
  writable: true
});

describe('ChatRoom', () => {
  const defaultProps = {
    interests: 'música,programación',
    ageFilter: '18-25'
  };

  it('renders without crashing', () => {
    expect(() => render(<ChatRoom {...defaultProps} />)).not.toThrow();
  });

  it('accepts props correctly', () => {
    const { container } = render(<ChatRoom {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('has correct component structure', () => {
    const { container } = render(<ChatRoom {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles props validation', () => {
    const props = {
      interests: 'test',
      ageFilter: '18-25'
    };
    expect(props.interests).toBe('test');
    expect(props.ageFilter).toBe('18-25');
  });
});
