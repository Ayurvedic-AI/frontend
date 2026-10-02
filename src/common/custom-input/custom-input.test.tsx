import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomInput } from './custom-input';

const baseProps = {
  name: 'test-input',
  placeholder: 'Enter value',
  value: '',
  onChange: vi.fn(),
};

describe('CustomInput', () => {
  it('renders with placeholder and name', () => {
    render(<CustomInput {...baseProps} />);
    const input = screen.getByPlaceholderText('Enter value');
    expect(input).toHaveAttribute('name', 'test-input');
  });

  it('fires onChange with the new value as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomInput {...baseProps} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('Enter value'), 'a');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)?.[0].target.value).toBe('a');
  });

  it('marks the field aria-invalid and renders the error message when hasError is true', () => {
    render(
      <CustomInput
        {...baseProps}
        hasError
        errorMessage="This field is required"
      />,
    );
    const input = screen.getByPlaceholderText('Enter value');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required');
  });

  it('toggles password visibility when isPassword is true', async () => {
    const user = userEvent.setup();
    render(<CustomInput {...baseProps} isPassword />);
    const input = screen.getByPlaceholderText('Enter value');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('disables the input when disableField is true', () => {
    render(<CustomInput {...baseProps} disableField />);
    expect(screen.getByPlaceholderText('Enter value')).toBeDisabled();
  });

  it('masks a phone number as Indian format while sending clean digits to onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CustomInput {...baseProps} phone onChange={onChange} />);
    const input = screen.getByPlaceholderText('Enter value');
    await user.type(input, '9876543210');
    // The display value reflects the Indian-format phone number…
    expect((input as HTMLInputElement).value).toBe('+91 98765 43210');
    // …and the most recent onChange payload carries just the national digits.
    expect(onChange.mock.calls.at(-1)?.[0].target.value).toBe('9876543210');
  });
});
