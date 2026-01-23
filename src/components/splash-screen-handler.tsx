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
    let pageLoaded = false;

    // Check if page is actually loaded (not just DOM ready)
    const checkPageLoaded = () => {
      // Check if React has rendered and page is interactive
      if (document.readyState === 'complete' && 
          document.body && 
          document.body.children.length > 0 &&
          !document.body.querySelector('[data-loading="true"]')) {
        return true;
      }
      return false;
    };

    const hideSplash = async () => {
      if (isHidden || !pageLoaded) return;
      isHidden = true;
      
      try {
        // Wait a bit to ensure page is fully rendered
        await new Promise(resolve => setTimeout(resolve, 800));
        await SplashScreen.hide();
      } catch (error) {
        console.error('Error hiding splash screen:', error);
      }
    };

    // Listen for Capacitor page loaded event
    const handleCapacitorPageLoaded = () => {
      if (checkPageLoaded()) {
        pageLoaded = true;
        hideSplash();
      }
    };
    window.addEventListener('capacitor-page-loaded', handleCapacitorPageLoaded, { once: true });

    // Poll for page load (more reliable than events)
    const checkInterval = setInterval(() => {
      if (checkPageLoaded()) {
        pageLoaded = true;
        clearInterval(checkInterval);
        hideSplash();
      }
    }, 200);

    // Also listen for load event
    const handleLoad = () => {
      if (checkPageLoaded()) {
        pageLoaded = true;
        clearInterval(checkInterval);
        hideSplash();
      }
    };
    window.addEventListener('load', handleLoad, { once: true });

    // Fallback: hide after max 30 seconds regardless (give more time for slow connections)
    const timeout = setTimeout(() => {
      pageLoaded = true;
      clearInterval(checkInterval);
      hideSplash();
    }, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(checkInterval);
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('capacitor-page-loaded', handleCapacitorPageLoaded);
    };
  }, []);

  return null;
}
