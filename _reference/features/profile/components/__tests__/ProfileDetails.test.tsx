import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileDetails } from '../ProfileDetails';
import type { MeResponse } from '../../../../sdk/schemas';

const baseUser: MeResponse = {
  uuid: '11111111-1111-1111-1111-111111111111',
  email: 'jyoti.varade@example.com',
  role: 'admin',
  is_active: true,
  first_name: 'Jyoti',
  last_name: 'Varade',
  phone: '+91 98765 43210',
};

describe('ProfileDetails', () => {
  it('renders email, role and an Active status badge', () => {
    render(<ProfileDetails user={baseUser} />);
    expect(screen.getAllByText('jyoti.varade@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows "Not set" for absent name/phone', () => {
    render(
      <ProfileDetails
        user={{ ...baseUser, first_name: null, last_name: null, phone: null }}
      />,
    );
    expect(screen.getAllByText('Not set').length).toBe(3);
  });

  it('falls back to the email local-part when no name is set', () => {
    render(
      <ProfileDetails
        user={{ ...baseUser, first_name: null, last_name: null }}
      />,
    );
    // Heading uses the email local-part as the display name.
    expect(screen.getByRole('heading', { name: 'jyoti.varade' })).toBeInTheDocument();
  });

  it('renders an Inactive badge when the account is not active', () => {
    render(<ProfileDetails user={{ ...baseUser, is_active: false }} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
