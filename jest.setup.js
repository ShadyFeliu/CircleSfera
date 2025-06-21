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
