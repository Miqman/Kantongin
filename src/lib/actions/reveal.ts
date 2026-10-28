import type { Action } from 'svelte/action';

export interface RevealOptions {
  /** Delay in milliseconds before animating (default: 0) */
  delay?: number;
  /** Y-axis translation distance in pixels (default: 24) */
  y?: number;
  /** Animation duration in milliseconds (default: 650) */
  duration?: number;
  /** Intersection threshold from 0 to 1 (default: 0.1) */
  threshold?: number;
  /** Custom rootMargin (default: '0px 0px -40px 0px') */
  rootMargin?: string;
}

/**
 * ponytail: Native IntersectionObserver Svelte action for smooth scroll-reveal animations.
 * - Zero dependencies, native platform features first.
 * - Respects prefers-reduced-motion for accessibility.
 * - Cleans up inline styles upon transition completion so hover transitions (e.g. hover:-translate-y-1) work unimpeded.
 * - Disconnects observer once revealed for maximum performance.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options = {}) => {
  if (typeof window === 'undefined') return;

  // Respect system accessibility setting
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const delay = options?.delay ?? 0;
  const y = options?.y ?? 24;
  const duration = options?.duration ?? 650;
  const threshold = options?.threshold ?? 0.1;
  const rootMargin = options?.rootMargin ?? '0px 0px -40px 0px';

  // Set initial hidden transform
  node.style.opacity = '0';
  node.style.transform = `translate3d(0, ${y}px, 0)`;
  node.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
  node.style.willChange = 'opacity, transform';

  let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.style.opacity = '1';
          node.style.transform = 'translate3d(0, 0, 0)';
          observer.unobserve(node);

          // Once transition finishes, release GPU memory and clean up inline transform/opacity
          // so hover effects like hover:-translate-y-1 are not overridden by inline styles.
          cleanupTimer = setTimeout(() => {
            node.style.opacity = '';
            node.style.transform = '';
            node.style.transition = '';
            node.style.willChange = '';
          }, duration + delay + 50);

          break;
        }
      }
    },
    {
      threshold,
      rootMargin,
    }
  );

  observer.observe(node);

  return {
    destroy() {
      if (cleanupTimer) clearTimeout(cleanupTimer);
      observer.disconnect();
    },
  };
};

