import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useInfiniteScroll - client-side infinite scroll for pre-loaded arrays.
 *
 * Data is already in memory; this hook just controls how many items are
 * rendered at once by slicing the array and appending more when the user
 * scrolls the sentinel element into view.
 *
 * @param items     The full, sorted/filtered array of items to paginate.
 * @param pageSize  Number of items per page. Default: 25.
 */
export function useInfiniteScroll<T>(items: T[], pageSize = 25) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset to first page whenever the source array or pageSize changes
  // (e.g. user applies a filter or changes the sort order).
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
  }, [items.length, pageSize]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    // Only attach the observer when there are actually more items to load.
    if (!hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Don't immediately fire — wait until the sentinel is genuinely below the
    // visible area. We use a scroll-triggered approach: track the first scroll
    // event and then attach IntersectionObserver, so the initial paint never
    // accidentally triggers a load.
    let observer: IntersectionObserver | null = null;

    const attachObserver = () => {
      if (observer) return; // already attached
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        {
          // No extra rootMargin — only trigger when sentinel is actually
          // entering the viewport from below.
          rootMargin: '0px',
          threshold: 0,
        }
      );
      observer.observe(sentinel);
    };

    // Check if the sentinel is already off-screen (below viewport).
    // If it is, we can safely attach the observer immediately.
    // If it's within the viewport, only attach after the user scrolls.
    const rect = sentinel.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    if (rect.top > viewportHeight) {
      // Sentinel is already below the fold — attach immediately.
      attachObserver();
    } else {
      // Sentinel is within the visible area (initial items don't fill the page).
      // Only start observing after the user deliberately scrolls down.
      const onScroll = () => {
        attachObserver();
        window.removeEventListener('scroll', onScroll, { capture: true });
      };
      window.addEventListener('scroll', onScroll, { capture: true, passive: true });
      return () => {
        window.removeEventListener('scroll', onScroll, { capture: true });
        observer?.disconnect();
      };
    }

    return () => {
      observer?.disconnect();
    };
  }, [hasMore, loadMore]);

  return { visibleItems, sentinelRef, hasMore, total: items.length };
}
