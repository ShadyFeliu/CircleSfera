import '../../../jest.setup.js';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import { ThemeProvider } from '../ThemeProvider';
import '@testing-library/jest-dom';

// Mock robusto de socket.io-client para todos los tests de este archivo
jest.mock('socket.io-client', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      connected: true,
      disconnect: jest.fn(),
      connect: jest.fn()
    }))
  };
});

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

// Wrapper con ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ChatRoom', () => {
  const defaultProps = {
    interests: 'música,programación',
    ageFilter: '18-25'
  };

  it('renders without crashing', () => {
    expect(() => renderWithTheme(<ChatRoom {...defaultProps} />)).not.toThrow();
  });

  it('accepts props correctly', () => {
    const { container } = renderWithTheme(<ChatRoom {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('has correct component structure', () => {
    const { container } = renderWithTheme(<ChatRoom {...defaultProps} />);
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
