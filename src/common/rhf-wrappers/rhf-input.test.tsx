import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { RHFInput } from './RHFInput';

/**
 * Locks in the as-you-type input filtering for product HSN/MRP/GST (#116).
 * Filtering happens in CustomInput's handleChange (not just onInput) and sets
 * the display value to the cleaned result, so even a trailing stripped char is
 * removed — the bug that let "ab12cd34xx" show as "1234xx" in production builds.
 */
function Harness(props: { isNumeric?: boolean; isDecimal?: boolean; uppercase?: boolean; maxLength?: number }) {
  const { control } = useForm<{ f: string }>({ defaultValues: { f: '' } });
  return <RHFInput<{ f: string }> name="f" control={control} placeholder="Enter" {...props} />;
}

const value = () => (screen.getByPlaceholderText('Enter') as HTMLInputElement).value;

describe('RHFInput input filtering', () => {
  it('isNumeric: strips everything but digits, including a trailing letter', async () => {
    const user = userEvent.setup();
    render(<Harness isNumeric maxLength={8} />);
    await user.type(screen.getByPlaceholderText('Enter'), 'ab12cd34xx');
    expect(value()).toBe('1234');
  });

  it('isDecimal: keeps digits and a single point, strips a trailing letter', async () => {
    const user = userEvent.setup();
    render(<Harness isDecimal />);
    await user.type(screen.getByPlaceholderText('Enter'), '9a9.9b');
    expect(value()).toBe('99.9');
  });

  it('isDecimal: collapses extra decimal points', async () => {
    const user = userEvent.setup();
    render(<Harness isDecimal />);
    await user.type(screen.getByPlaceholderText('Enter'), '1.2.3');
    expect(value()).toBe('1.23');
  });

  it('uppercase: upper-cases as typed', async () => {
    const user = userEvent.setup();
    render(<Harness uppercase />);
    await user.type(screen.getByPlaceholderText('Enter'), 'ab1c');
    expect(value()).toBe('AB1C');
  });

  it('plain: leaves the value untouched (pack size keeps units)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByPlaceholderText('Enter'), '250g jar');
    expect(value()).toBe('250g jar');
  });
});
