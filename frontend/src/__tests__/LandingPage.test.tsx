import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from '../app/page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

describe('Futuristic LandingPage Component', () => {
  it('renders branding title and futuristic telemetry badges', () => {
    render(<LandingPage />);

    expect(screen.getByText('Minimalist cloud storage built for speed & scale.')).toBeInTheDocument();
    expect(screen.getByText('[ PROTOCOL v2.0 // AWS S3 SERVERLESS STORAGE ]')).toBeInTheDocument();
    expect(screen.getByText('Direct Presigned S3 Uploads')).toBeInTheDocument();
  });

  it('navigates to /login when clicking Initialize Drive or Get Started', () => {
    render(<LandingPage />);

    const getStartedBtn = screen.getByText('Get Started for Free');
    fireEvent.click(getStartedBtn);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('switches console tabs in holographic demo', () => {
    render(<LandingPage />);

    const ttlTabBtn = screen.getByText('25-Day TTL');
    fireEvent.click(ttlTabBtn);

    expect(screen.getByText('// DynamoDB Single-Table Time-To-Live (TTL) Auto-Purge Rule')).toBeInTheDocument();
  });
});
