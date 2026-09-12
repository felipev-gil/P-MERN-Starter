import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './auth-context';
import { auth } from '../services/auth';
vi.mock('../services/auth', () => ({ auth: { me: vi.fn() } }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });
function Status() { const { user, notice } = useAuth(); return <p>{user ? user.name : 'Signed out'} {notice}</p>; }
it('clears an idle session when its server-provided expiration arrives', async () => {
  vi.useFakeTimers();
  auth.me.mockResolvedValue({ user: { name: 'Example' }, expiresAt: new Date(Date.now() + 1000).toISOString() });
  await act(async () => { render(<AuthProvider><Status /></AuthProvider>); });
  expect(screen.getByText('Example')).toBeTruthy();
  await act(async () => { vi.advanceTimersByTime(1001); });
  expect(screen.getByText(/Signed out Your session expired/)).toBeTruthy();
});
