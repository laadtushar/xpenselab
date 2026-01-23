package com.xpenselab.app;

import android.graphics.Bitmap;
import android.net.http.SslError;
import android.os.Bundle;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        // Splash screen is handled by Capacitor automatically based on config
    }

    @Override
    public void onResume() {
        super.onResume();
        
        // Configure WebView settings for better network handling
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            // Enable JavaScript
            settings.setJavaScriptEnabled(true);
            // Enable DOM storage
            settings.setDomStorageEnabled(true);
            // Enable database storage
            settings.setDatabaseEnabled(true);
            // Set cache mode to load from network first, then cache
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            // Enable mixed content (if needed)
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
            // Set user agent
            settings.setUserAgentString(settings.getUserAgentString());
            // Enable file access
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            
            // Set custom WebViewClient to handle errors and page load completion
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    // Let WebView handle all URLs normally
                    return false;
                }

                @Override
                public void onPageStarted(WebView view, String url, Bitmap favicon) {
                    super.onPageStarted(view, url, favicon);
                    // Splash screen should stay visible (handled by Capacitor config)
                }

                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    // Page is loaded, JavaScript will handle hiding splash screen
                    // But we can also trigger it here as a fallback
                    try {
                        // Execute JavaScript to trigger splash screen hide
                        view.evaluateJavascript(
                            "if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) { " +
                            "window.Capacitor.Plugins.SplashScreen.hide(); " +
                            "} else if (window.dispatchEvent) { " +
                            "window.dispatchEvent(new Event('load')); " +
                            "}",
                            null
                        );
                    } catch (Exception e) {
                        // Ignore errors
                    }
                }

                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    // Only handle main frame errors (page load failures)
                    if (request.isForMainFrame()) {
                        int errorCode = error.getErrorCode();
                        String errorDescription = error.getDescription().toString();
                        
                        // Check if it's a real connection error (not just a redirect or temporary issue)
                        // ERROR_CONNECTION_ABORTED (error code -2) might be a false positive
                        if (errorCode == WebViewClient.ERROR_TIMEOUT) {
                            // Timeout - show error page
                            String errorHtml = generateErrorPage("Connection timeout. Please check your internet connection.", errorCode);
                            view.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null);
                        } else if (errorCode == WebViewClient.ERROR_CONNECT && 
                                   !errorDescription.contains("aborted") &&
                                   !errorDescription.contains("redirect")) {
                            // Connection error (but not aborted/redirect which might be false positives)
                            String errorHtml = generateErrorPage("Unable to connect. Please check your internet connection.", errorCode);
                            view.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null);
                        } else if (errorCode == WebViewClient.ERROR_IO) {
                            // IO error
                            String errorHtml = generateErrorPage("Network error. Please try again.", errorCode);
                            view.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null);
                        } else {
                            // For other errors (including connection aborted which might be a redirect), 
                            // let the default handler deal with it or retry
                            super.onReceivedError(view, request, error);
                        }
                    }
                }

                @Override
                public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                    // For production, cancel SSL errors (don't allow invalid certificates)
                    handler.cancel();
                    String errorHtml = generateErrorPage("SSL Certificate Error: " + error.toString(), error.getPrimaryError());
                    view.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null);
                }
            });
        }
    }

    private String generateErrorPage(String errorDescription, int errorCode) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<style>" +
                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; " +
                "display: flex; flex-direction: column; align-items: center; justify-content: center; " +
                "min-height: 100vh; margin: 0; padding: 20px; background: #101622; color: #fff; text-align: center; }" +
                ".container { max-width: 400px; }" +
                "h1 { font-size: 24px; margin-bottom: 16px; }" +
                "p { font-size: 16px; color: #a0a0a0; margin-bottom: 24px; line-height: 1.5; }" +
                "button { background: #2563eb; color: white; border: none; padding: 12px 24px; " +
                "font-size: 16px; border-radius: 8px; cursor: pointer; }" +
                "button:active { background: #1d4ed8; }" +
                ".icon { font-size: 64px; margin-bottom: 16px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class=\"container\">" +
                "<div class=\"icon\">⚠️</div>" +
                "<h1>Unable to Load Page</h1>" +
                "<p>" + escapeHtml(errorDescription) + "</p>" +
                "<button onclick=\"window.location.reload()\">Retry</button>" +
                "</div>" +
                "<script>" +
                "// Auto-retry when connection is restored" +
                "window.addEventListener('online', function() { window.location.reload(); });" +
                "</script>" +
                "</body>" +
                "</html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}
