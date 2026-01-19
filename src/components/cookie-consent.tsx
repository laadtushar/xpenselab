'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Cookie, Info, Settings } from 'lucide-react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'xpenselab_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'xpenselab_cookie_preferences';

export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  performance: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  performance: false,
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (!consent) {
      // Show banner if no consent has been given
      setShowBanner(true);
    } else if (savedPreferences) {
      // Load saved preferences
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Failed to parse cookie preferences:', error);
      }
    }
  }, []);

  const savePreferences = (newPreferences: CookiePreferences) => {
    // Essential cookies are always enabled
    const finalPreferences = { ...newPreferences, essential: true };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(finalPreferences));
    setPreferences(finalPreferences);
    setShowBanner(false);
    setShowPreferences(false);

    // Apply preferences (e.g., disable monitoring if analytics/performance are disabled)
    if (!finalPreferences.performance && !finalPreferences.analytics) {
      // You can disable monitoring here if needed
      // This is handled by NEXT_PUBLIC_DISABLE_MONITORING env var
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      performance: true,
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected: CookiePreferences = {
      essential: true,
      analytics: false,
      performance: false,
    };
    savePreferences(allRejected);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const handlePreferenceChange = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return; // Essential cannot be disabled
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (!showBanner && !showPreferences) {
    return null;
  }

  return (
    <>
      {/* Cookie Consent Banner */}
      <Dialog open={showBanner && !showPreferences} onOpenChange={setShowBanner}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              <DialogTitle>Cookie Consent</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. 
              By clicking "Accept All", you consent to our use of cookies. You can also customize your preferences 
              or reject non-essential cookies.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="essential-cookies" className="font-semibold cursor-pointer">
                    Essential Cookies
                  </Label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <Checkbox id="essential-cookies" checked={true} disabled />
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Required for the application to function. Includes authentication, security, and basic functionality.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="analytics-cookies" className="font-semibold cursor-pointer">
                    Analytics Cookies
                  </Label>
                </div>
                <Checkbox 
                  id="analytics-cookies" 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked as boolean)}
                />
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="performance-cookies" className="font-semibold cursor-pointer">
                    Performance Cookies
                  </Label>
                </div>
                <Checkbox 
                  id="performance-cookies" 
                  checked={preferences.performance}
                  onCheckedChange={(checked) => handlePreferenceChange('performance', checked as boolean)}
                />
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Monitor application performance and detect errors to improve user experience. No personal data is collected.
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-4">
            Learn more about how we use cookies in our{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            {' '}and{' '}
            <Link href="/privacy#gdpr" className="underline hover:text-foreground">
              GDPR Compliance
            </Link>
            .
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBanner(false);
                setShowPreferences(true);
              }}
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4 mr-2" />
              Customize
            </Button>
            <Button
              variant="outline"
              onClick={handleRejectAll}
              className="w-full sm:w-auto"
            >
              Reject All
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto"
            >
              Accept All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cookie Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <DialogTitle>Cookie Preferences</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Manage your cookie preferences. Essential cookies cannot be disabled as they are required for the application to function.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="pref-essential" className="font-semibold cursor-pointer">
                    Essential Cookies
                  </Label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <Checkbox id="pref-essential" checked={true} disabled />
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Required for authentication, security, and core functionality. These cookies cannot be disabled.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="pref-analytics" className="font-semibold cursor-pointer">
                    Analytics Cookies
                  </Label>
                </div>
                <Checkbox 
                  id="pref-analytics" 
                  checked={preferences.analytics}
                  onCheckedChange={(checked) => handlePreferenceChange('analytics', checked as boolean)}
                />
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Help us understand how visitors use our website. Data is collected anonymously and used for website improvement.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="pref-performance" className="font-semibold cursor-pointer">
                    Performance Cookies
                  </Label>
                </div>
                <Checkbox 
                  id="pref-performance" 
                  checked={preferences.performance}
                  onCheckedChange={(checked) => handlePreferenceChange('performance', checked as boolean)}
                />
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Monitor application performance, detect errors, and improve user experience. No personal or sensitive data is collected.
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-4">
            You can change these preferences at any time. Learn more in our{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreferences(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook to check cookie consent
export function useCookieConsent() {
  const [hasConsented, setHasConsented] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (consent === 'true') {
      setHasConsented(true);
      if (savedPreferences) {
        try {
          setPreferences(JSON.parse(savedPreferences));
        } catch (error) {
          console.error('Failed to parse cookie preferences:', error);
        }
      }
    }
  }, []);

  return { hasConsented, preferences };
}
