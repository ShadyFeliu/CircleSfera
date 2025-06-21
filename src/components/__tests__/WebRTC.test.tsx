import { render, act } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import '@testing-library/jest-dom';

describe('ChatRoom WebRTC', () => {
  const defaultProps = {
    interests: 'música',
    ageFilter: '18-25'
  };

  it('handles ICE connection state changes', async () => {
    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    // Simulate ICE connection state changes
    act(() => {
      const peerConnection = new RTCPeerConnection();
      peerConnection.iceConnectionState = 'checking';
      peerConnection.dispatchEvent(new Event('iceconnectionstatechange'));
    });

    expect(getByText(/Conectando/i)).toBeInTheDocument();
  });

  it('monitors connection quality', async () => {
    const mockStats = new Map([
      ['inbound-rtp', {
        type: 'inbound-rtp',
        packetsLost: 50,
        packetsReceived: 1000
      }],
      ['candidate-pair', {
        type: 'candidate-pair',
        currentRoundTripTime: 0.1
      }]
    ]);

    global.RTCPeerConnection.prototype.getStats = jest.fn().mockResolvedValue(mockStats);

    const { getByText } = render(<ChatRoom {...defaultProps} />);
    
    // Wait for connection quality update
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5000));
    });

    expect(getByText(/Regular conexión/i)).toBeInTheDocument();
  });
});
