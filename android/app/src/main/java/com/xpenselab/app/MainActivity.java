package com.xpenselab.app;

import android.graphics.Bitmap;
import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        
        // Set custom WebViewClient to handle errors
        getBridge().getWebView().setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                // Only handle main frame errors (page load failures)
                if (request.isForMainFrame()) {
                    // Load a custom error page HTML
                    String errorHtml = generateErrorPage(error.getDescription().toString(), error.getErrorCode());
                    view.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null);
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // For SSL errors, you might want to show a warning or allow it in dev
                // For production, it's safer to cancel
                handler.cancel();
                String errorHtml = generateErrorPage("SSL Certificate Error", error.getPrimaryError());
                view.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null);
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
            }
        });
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
