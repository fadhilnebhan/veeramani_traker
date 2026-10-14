import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntroAnimation } from '@/components/intro-animation';

describe('IntroAnimation Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders intro animation dialog on initial session visit', () => {
    // Mock matchMedia for normal motion
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<IntroAnimation forceShow={true} />);
    expect(screen.getByRole('dialog', { name: /welcome intro animation/i })).toBeDefined();
    expect(screen.getByText(/skip intro/i)).toBeDefined();
  });

  it('allows user to skip the intro and persists flag to sessionStorage', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const onComplete = vi.fn();
    render(<IntroAnimation onComplete={onComplete} forceShow={true} />);

    const skipButton = screen.getByText(/skip intro/i);
    fireEvent.click(skipButton);

    expect(onComplete).toHaveBeenCalled();
    expect(sessionStorage.getItem('veeramani_tracker_intro_seen')).toBe('true');
  });

  it('bypasses intro when prefers-reduced-motion is active', () => {
    // Mock matchMedia returning true for reduced motion
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const onComplete = vi.fn();
    const { container } = render(<IntroAnimation onComplete={onComplete} forceShow={false} />);

    expect(onComplete).toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });
});
