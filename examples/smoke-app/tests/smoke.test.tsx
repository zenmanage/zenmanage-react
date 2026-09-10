import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SmokeApp } from '../src/App';

describe('zenmanage-react smoke app', () => {
  it('renders provider, hooks, HOC, and gate paths', async () => {
    render(<SmokeApp />);

    await waitFor(() => {
      expect(screen.getByText('New checkout (one-page)')).toBeTruthy();
      expect(screen.getByText('FlagGate enabled')).toBeTruthy();
      expect(screen.getByText('Promo Card')).toBeTruthy();
    });
  });
});
