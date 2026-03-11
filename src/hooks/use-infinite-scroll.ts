import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useInfiniteScroll - client-side infinite scroll for pre-loaded arrays.
 *
 * Data is already in memory; this hook just controls how many items are
 * rendered at once by slicing the array and appending more when the user
 * scrolls near the sentinel element.
 *
 * @param items  The full, sorted/filtered array of items to paginate.
 * @param pageSize  How many items to show per "page". Default: 25.
 */
export function useInfiniteScroll<T>(items: T[], pageSize = 25) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count whenever the source array changes
  // (i.e. when the user applies a filter or changes the sort order)
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
  }, [items.length, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        // Start loading a bit before the sentinel is fully in view
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return { visibleItems, sentinelRef, hasMore, total: items.length };
}
