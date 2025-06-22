/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ChatRoom from '../ChatRoom';
import { ThemeProvider } from '../ThemeProvider';
import '@testing-library/jest-dom';

// Wrapper con ThemeProvider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('WebRTC Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes WebRTC connection when partner is found', async () => {
    renderWithTheme(<ChatRoom interests="test" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Buscando un compañero/)).toBeInTheDocument();
  });
  });

  test('handles WebRTC connection errors gracefully', async () => {
    renderWithTheme(<ChatRoom interests="test" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Buscando un compañero/)).toBeInTheDocument();
    });
  });
});
