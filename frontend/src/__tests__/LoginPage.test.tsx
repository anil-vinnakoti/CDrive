import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../app/login/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  });

  it('renders Google Client ID setup form when no Client ID is stored', () => {
    render(<LoginPage />);

    expect(screen.getByText('CDrive')).toBeInTheDocument();
    expect(screen.getByText('Setup Google OAuth Client ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('xxxxxx-xxxxxxxx.apps.googleusercontent.com')).toBeInTheDocument();
  });

  it('allows user to type and save Google Client ID into localStorage', () => {
    render(<LoginPage />);

    const input = screen.getByPlaceholderText('xxxxxx-xxxxxxxx.apps.googleusercontent.com');
    const submitBtn = screen.getByText('Save Client ID & Enable Google Sign-In');

    fireEvent.change(input, { target: { value: '12345-abcde.apps.googleusercontent.com' } });
    fireEvent.click(submitBtn);

    expect(localStorage.getItem('cdrive_google_client_id')).toBe('12345-abcde.apps.googleusercontent.com');
  });
});
