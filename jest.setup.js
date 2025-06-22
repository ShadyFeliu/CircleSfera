// Mock window.AudioContext
window.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: () => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn()
    }
  }),
  createGain: () => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn()
    }
  }),
  destination: {}
}));

// Also mock webkitAudioContext for older browsers
window.webkitAudioContext = window.AudioContext;

// Mock window.URL
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();

// Mock WebRTC
class MockRTCPeerConnection {
  constructor() {
    this.onicecandidate = null;
    this.ontrack = null;
    this.iceConnectionState = 'new';
  }
  
  addEventListener() {}
  removeEventListener() {}
  addTrack() {}
  close() {}
  
  setLocalDescription() {
    return Promise.resolve();
  }
  
  setRemoteDescription() {
    return Promise.resolve();
  }
  
  createOffer() {
    return Promise.resolve({ type: 'offer', sdp: 'mock-sdp' });
  }
  
  createAnswer() {
    return Promise.resolve({ type: 'answer', sdp: 'mock-sdp' });
  }
}

global.RTCPeerConnection = MockRTCPeerConnection;

// Mock performance.now
global.performance.now = jest.fn(() => Date.now());

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock de RTCPeerConnection
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  iceConnectionState: 'new',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  getStats: jest.fn().mockResolvedValue(new Map()),
  close: jest.fn()
}));

// Agregar generateCertificate al constructor
global.RTCPeerConnection.generateCertificate = jest.fn().mockResolvedValue({});

// Mock de MediaStream
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

// Mock de socket.io-client global y robusto
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

// Mock de simple-peer
jest.mock('simple-peer', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    on: jest.fn(),
    signal: jest.fn(),
    destroy: jest.fn(),
    removeAllListeners: jest.fn()
  }))
}));
