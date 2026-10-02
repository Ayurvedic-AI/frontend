import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Canonical class-merge helper for the project.
 * Combines `clsx` (conditional class composition) with `tailwind-merge`
 * (deterministic resolution of conflicting Tailwind utilities).
 *
 * Usage: cn('px-4 py-2', isActive && 'bg-primary', extraClassName)
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
