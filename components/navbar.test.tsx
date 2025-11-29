import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from './navbar';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: null,
        status: 'unauthenticated',
    }),
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: vi.fn(),
    }),
}));

describe('Navbar', () => {
    it('renders the logo', () => {
        render(<Navbar />);
        const logo = screen.getByText('AI Platform');
        expect(logo).toBeDefined();
    });

    it('renders sign in button when unauthenticated', () => {
        render(<Navbar />);
        const signInButton = screen.getByText('Sign In');
        expect(signInButton).toBeDefined();
    });
});
