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

    // Show splash screen immediately when component mounts
    const showSplash = async () => {
      try {
        await SplashScreen.show({
          showDuration: 0,
          autoHide: false,
        });
      } catch (error) {
        console.error('Error showing splash screen:', error);
      }
    };

    showSplash();

    let isHidden = false;

    const hideSplash = async () => {
      if (isHidden) return;
      isHidden = true;
      
      try {
        // Wait a bit to ensure page is rendered and user sees content
        await new Promise(resolve => setTimeout(resolve, 500));
        await SplashScreen.hide();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    };

    // Hide when DOM is ready and page has loaded
    const checkAndHide = () => {
      // Only hide if page is actually loaded (not just DOM ready)
      if (document.readyState === 'complete') {
        hideSplash();
      }
    };

    // Wait for full page load
    if (document.readyState === 'complete') {
      // Page already loaded, wait a bit then hide
      setTimeout(hideSplash, 500);
    } else {
      // Wait for page load
      window.addEventListener('load', hideSplash, { once: true });
    }

    // Fallback: hide after max 10 seconds regardless
    const timeout = setTimeout(hideSplash, 10000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('load', hideSplash);
    };
  }, []);

  return null;
}
