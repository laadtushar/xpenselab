'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Component to handle splash screen visibility in Capacitor apps
 * Hides splash screen when the page is fully loaded
 */
export function SplashScreenHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Only run in native apps
    }

    let isHidden = false;

    const hideSplash = async () => {
      if (isHidden) return;
      isHidden = true;
      
      try {
        // Wait a tiny bit to ensure page is rendered
        await new Promise(resolve => setTimeout(resolve, 300));
        await SplashScreen.hide();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    };

    // Hide when DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      hideSplash();
    } else {
      // Wait for page load
      window.addEventListener('load', hideSplash, { once: true });
      // Also hide when DOMContentLoaded fires (faster)
      document.addEventListener('DOMContentLoaded', hideSplash, { once: true });
    }

    // Fallback: hide after max 5 seconds regardless
    const timeout = setTimeout(hideSplash, 5000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('load', hideSplash);
      document.removeEventListener('DOMContentLoaded', hideSplash);
    };
  }, []);

  return null;
}
