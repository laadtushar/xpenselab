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
  const initialRenderRef = useRef(true);

  // Reset to first page whenever the source array or pageSize changes
  // (e.g. user applies a filter or changes the sort order).
  useEffect(() => {
    setVisibleCount(pageSize);
    initialRenderRef.current = true;
  }, [items, pageSize]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
  }, [items.length, pageSize]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    if (!hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        // Skip the very first intersection callback that fires on mount
        // when the sentinel is already inside the viewport (list is short).
        if (initialRenderRef.current) {
          initialRenderRef.current = false;
          return;
        }

        loadMore();
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(sentinel);

    // After the initial paint, mark fresh render complete so subsequent
    // intersection events (real scrolls) are handled normally.
    // Use rAF to wait for the browser paint, then allow future callbacks.
    const rafId = requestAnimationFrame(() => {
      initialRenderRef.current = false;
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return { visibleItems, sentinelRef, hasMore, total: items.length };
}
