import { render, fireEvent } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import '@testing-library/jest-dom';

describe('ChatRoom Error Handling', () => {
  const defaultProps = {
    interests: 'música',
    ageFilter: '18-25'
  };

  it('shows connection error message when WebSocket fails', async () => {
    // Mock socket.io to emit error
    jest.mock('socket.io-client', () => {
      return jest.fn(() => ({
        on: (event: string, cb: Function) => {
          if (event === 'error') {
            cb({ message: 'Connection failed' });
          }
        },
        emit: jest.fn(),
        disconnect: jest.fn()
      }));
    });

    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    expect(getByText('Error de Conexión')).toBeInTheDocument();
    expect(getByText('Connection failed')).toBeInTheDocument();
  });

  it('shows banned message when user is banned', async () => {
    // Mock socket.io to emit banned event
    jest.mock('socket.io-client', () => {
      return jest.fn(() => ({
        on: (event: string, cb: Function) => {
          if (event === 'banned') {
            cb({ message: 'You have been banned' });
          }
        },
        emit: jest.fn(),
        disconnect: jest.fn()
      }));
    });

    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    expect(getByText('You have been banned')).toBeInTheDocument();
  });

  it('attempts reconnection on recoverable errors', async () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn()
    };

    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));

    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    // Simulate recoverable error
    mockSocket.on.mock.calls.find(call => call[0] === 'error')[1]({
      message: 'Network error',
      reconnectable: true
    });

    expect(getByText(/Reintentando conexión/i)).toBeInTheDocument();
  });

  it('shows reload button on max reconnection attempts', async () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn()
    };

    jest.mock('socket.io-client', () => jest.fn(() => mockSocket));

    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    // Simulate multiple reconnection attempts
    for (let i = 0; i < 4; i++) {
      mockSocket.on.mock.calls.find(call => call[0] === 'error')[1]({
        message: 'Network error',
        reconnectable: true
      });
    }

    expect(getByText('Reiniciar Aplicación')).toBeInTheDocument();
  });
});
