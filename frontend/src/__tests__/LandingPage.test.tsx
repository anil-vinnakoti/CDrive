import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FuturisticLandingPage from '../app/page';

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
    render(<FuturisticLandingPage />);

    expect(screen.getByText('OBSIDIAN CLOUD STORAGE FOR DEVELOPERS & CREATORS.')).toBeInTheDocument();
    expect(screen.getByText('SYS_ENGINE // DIRECT S3 PRESIGNED PROTOCOL')).toBeInTheDocument();
    expect(screen.getByText('Direct S3 Presigned PUTs')).toBeInTheDocument();
  });

  it('navigates to /login when clicking LAUNCH APPLICATION', () => {
    render(<FuturisticLandingPage />);

    const launchBtn = screen.getByText('LAUNCH APPLICATION');
    fireEvent.click(launchBtn);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('runs interactive upload simulator when sample file button is clicked', () => {
    render(<FuturisticLandingPage />);

    const sampleBtn = screen.getByText('+ dataset_final.json');
    fireEvent.click(sampleBtn);

    const matches = screen.getAllByText(/dataset_final\.json/i);
    expect(matches.length).toBeGreaterThan(1);
  });
});
