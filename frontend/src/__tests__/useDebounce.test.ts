import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 200));
    expect(result.current).toBe('initial');
  });

  it('should update debounced value after specified delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 'first' },
    });

    expect(result.current).toBe('first');

    rerender({ value: 'second' });
    expect(result.current).toBe('first'); // Not updated yet

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('second');
  });
});
