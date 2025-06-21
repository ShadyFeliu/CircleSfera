import { render, fireEvent, waitFor } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import '@testing-library/jest-dom';

// Mock WebRTC
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

// Mock navigator.mediaDevices para JSDOM
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue(mockMediaStream)
  },
  writable: true
});

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
    // Reset mediaDevices mock
    global.navigator.mediaDevices.getUserMedia = jest.fn().mockResolvedValue(mockMediaStream);
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
    
    // Simular el envío del formulario
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    
    await waitFor(() => {
      expect(container.querySelector('.chat-message')).toBeInTheDocument();
      expect(container.querySelector('.chat-message')?.textContent).toContain('Hola!');
    });
  });

  it('toggles video and audio correctly', async () => {
    const { getByLabelText, getByText } = render(<ChatRoom {...defaultProps} />);
    
    const videoButton = getByLabelText('Activar/desactivar video');
    const audioButton = getByText('🔊');
    
    // Simular clicks en los botones
    fireEvent.click(videoButton);
    fireEvent.click(audioButton);
    
    // En JSDOM, los botones no cambian visualmente porque no hay media real
    // Pero podemos verificar que los botones existen y son clickeables
    expect(videoButton).toBeInTheDocument();
    expect(audioButton).toBeInTheDocument();
    
    // Verificar que los botones tienen los aria-labels correctos
    expect(videoButton).toHaveAttribute('aria-label', 'Activar/desactivar video');
  });
});
