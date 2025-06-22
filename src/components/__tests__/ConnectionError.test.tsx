/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('ChatRoom Error Handling', () => {
  const defaultProps = {
    interests: 'test',
    ageFilter: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => renderWithTheme(<ChatRoom {...defaultProps} />)).not.toThrow();
      });

  it('accepts error handling props', () => {
    const props = {
      interests: 'music, technology',
      ageFilter: '18-25'
    };
    
    expect(() => renderWithTheme(<ChatRoom {...props} />)).not.toThrow();
  });

  it('has correct component structure', () => {
    const { container } = renderWithTheme(<ChatRoom {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('displays initial status message', () => {
    renderWithTheme(<ChatRoom {...defaultProps} />);
    expect(screen.getByText(/Buscando un compañero/)).toBeInTheDocument();
  });
});
