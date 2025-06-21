import { render, fireEvent, waitFor } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import '@testing-library/jest-dom';

// Mock WebRTC
const mockMediaStream = {
  getTracks: () => [{
    stop: jest.fn(),
    enabled: true
  }]
};

global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
};

// Mock Socket.IO
jest.mock('socket.io-client', () => {
  const emit = jest.fn();
  const on = jest.fn();
  const disconnect = jest.fn();
  
  return jest.fn(() => ({
    emit,
    on,
    disconnect,
    connect: jest.fn()
  }));
});

describe('ChatRoom', () => {
  const defaultProps = {
    interests: 'música,programación',
    ageFilter: '18-25'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial loading state', () => {
    const { getByText } = render(<ChatRoom {...defaultProps} />);
    expect(getByText(/Buscando un compañero/i)).toBeInTheDocument();
  });

  it('shows media access error when getUserMedia fails', async () => {
    global.navigator.mediaDevices.getUserMedia = jest.fn().mockRejectedValue(new Error('Media access denied'));
    
    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    await waitFor(() => {
      expect(getByText(/No se pudo acceder a la cámara o micrófono/i)).toBeInTheDocument();
    });
  });

  it('allows sending messages', async () => {
    const { getByPlaceholderText, container } = render(<ChatRoom {...defaultProps} />);
    
    const input = getByPlaceholderText(/Escribe un mensaje/i);
    fireEvent.change(input, { target: { value: 'Hola!' } });
    fireEvent.submit(container.querySelector('form')!);
    
    await waitFor(() => {
      expect(container.querySelector('.chat-message')).toBeInTheDocument();
    });
  });

  it('toggles video and audio correctly', async () => {
    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    const videoButton = getByText('📷');
    const audioButton = getByText('🔊');
    
    fireEvent.click(videoButton);
    fireEvent.click(audioButton);
    
    await waitFor(() => {
      expect(getByText('📹')).toBeInTheDocument();
      expect(getByText('🔇')).toBeInTheDocument();
    });
  });
});
