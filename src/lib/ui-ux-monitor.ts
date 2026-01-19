/**
 * UI/UX Runtime Monitor
 * 
 * Detects common UI/UX issues at runtime across responsive screens:
 * - Layout shifts and overlaps
 * - Touch target sizes
 * - Text readability
 * - Viewport issues
 * - Accessibility violations
 */

interface UIUXIssue {
  type: 'layout-shift' | 'touch-target' | 'text-overlap' | 'viewport' | 'accessibility';
  severity: 'low' | 'medium' | 'high';
  message: string;
  element?: HTMLElement;
  details?: Record<string, unknown>;
}

/**
 * Detects if touch targets are too small (minimum 44x44px recommended)
 */
export function checkTouchTargets(): UIUXIssue[] {
  const issues: UIUXIssue[] = [];
  const interactiveElements = document.querySelectorAll<HTMLElement>(
    'button, a, input, select, textarea, [role="button"], [onclick]'
  );

  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // WCAG 2.1 AA minimum

    if (rect.width < minSize || rect.height < minSize) {
      issues.push({
        type: 'touch-target',
        severity: rect.width < 24 || rect.height < 24 ? 'high' : 'medium',
        message: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum: ${minSize}x${minSize}px)`,
        element,
        details: {
          width: rect.width,
          height: rect.height,
          tagName: element.tagName,
        },
      });
    }
  });

  return issues;
}

/**
 * Detects text overlap or clipping issues
 */
export function checkTextOverlap(): UIUXIssue[] {
  const issues: UIUXIssue[] = [];
  const textElements = document.querySelectorAll<HTMLElement>(
    'p, h1, h2, h3, h4, h5, h6, span, div, label'
  );

  const elements = Array.from(textElements);
  
  for (let i = 0; i < elements.length; i++) {
    const el1 = elements[i];
    const rect1 = el1.getBoundingClientRect();
    const text1 = el1.textContent?.trim();
    
    if (!text1 || rect1.width === 0 || rect1.height === 0) continue;

    for (let j = i + 1; j < elements.length; j++) {
      const el2 = elements[j];
      const rect2 = el2.getBoundingClientRect();
      const text2 = el2.textContent?.trim();
      
      if (!text2 || rect2.width === 0 || rect2.height === 0) continue;

      // Check if elements overlap significantly
      const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
      const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
      const overlapArea = overlapX * overlapY;
      const area1 = rect1.width * rect1.height;
      const area2 = rect2.width * rect2.height;
      const overlapRatio = Math.max(overlapArea / area1, overlapArea / area2);

      if (overlapRatio > 0.3 && overlapRatio < 0.95) {
        // Significant overlap but not complete overlap (which might be intentional)
        issues.push({
          type: 'text-overlap',
          severity: overlapRatio > 0.5 ? 'high' : 'medium',
          message: `Text overlap detected: "${text1.substring(0, 30)}..." overlaps with "${text2.substring(0, 30)}..."`,
          element: el1,
          details: {
            overlapRatio,
            text1: text1.substring(0, 50),
            text2: text2.substring(0, 50),
          },
        });
      }
    }
  }

  return issues;
}

/**
 * Checks viewport and responsive design issues
 */
export function checkViewportIssues(): UIUXIssue[] {
  const issues: UIUXIssue[] = [];
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check for horizontal scroll (common responsive issue)
  if (document.documentElement.scrollWidth > viewportWidth) {
    issues.push({
      type: 'viewport',
      severity: 'high',
      message: `Horizontal scroll detected: content width (${document.documentElement.scrollWidth}px) exceeds viewport (${viewportWidth}px)`,
      details: {
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth,
        overflow: document.documentElement.scrollWidth - viewportWidth,
      },
    });
  }

  // Check for elements extending beyond viewport
  const allElements = document.querySelectorAll<HTMLElement>('*');
  allElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.right > viewportWidth + 10 || rect.left < -10) {
      const style = window.getComputedStyle(element);
      if (style.position !== 'fixed' && style.position !== 'absolute') {
        issues.push({
          type: 'viewport',
          severity: 'medium',
          message: `Element extends beyond viewport: ${element.tagName}`,
          element,
          details: {
            left: rect.left,
            right: rect.right,
            viewportWidth,
          },
        });
      }
    }
  });

  return issues;
}

/**
 * Checks for common accessibility issues
 */
export function checkAccessibilityIssues(): UIUXIssue[] {
  const issues: UIUXIssue[] = [];

  // Check for images without alt text
  const images = document.querySelectorAll<HTMLImageElement>('img');
  images.forEach((img) => {
    if (!img.alt && !img.getAttribute('aria-hidden')) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        message: 'Image missing alt text',
        element: img,
      });
    }
  });

  // Check for buttons without accessible names
  const buttons = document.querySelectorAll<HTMLButtonElement>('button');
  buttons.forEach((button) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute('aria-label');
    const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
    
    if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        message: 'Button missing accessible name',
        element: button,
      });
    }
  });

  // Check for low contrast (basic check)
  const textElements = document.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, h5, h6, span, div, label, button, a');
  textElements.forEach((element) => {
    const style = window.getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight) || 400;
    
    // Small text or low weight might have contrast issues
    if (fontSize < 12 && fontWeight < 500) {
      issues.push({
        type: 'accessibility',
        severity: 'low',
        message: `Small text detected (${fontSize}px) - verify contrast ratio meets WCAG AA`,
        element,
        details: {
          fontSize,
          fontWeight,
        },
      });
    }
  });

  return issues;
}

/**
 * Runs all UI/UX checks and returns all detected issues
 */
export function runUIUXChecks(): UIUXIssue[] {
  const issues: UIUXIssue[] = [
    ...checkTouchTargets(),
    ...checkTextOverlap(),
    ...checkViewportIssues(),
    ...checkAccessibilityIssues(),
  ];

  return issues;
}

/**
 * Logs UI/UX issues to console (for development)
 */
export function logUIUXIssues(issues: UIUXIssue[]): void {
  if (process.env.NODE_ENV === 'development' && issues.length > 0) {
    console.group('🔍 UI/UX Issues Detected');
    issues.forEach((issue) => {
      const emoji = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      console.log(`${emoji} [${issue.severity.toUpperCase()}] ${issue.type}:`, issue.message, issue.details || '');
      if (issue.element) {
        console.log('   Element:', issue.element);
      }
    });
    console.groupEnd();
  }
}
