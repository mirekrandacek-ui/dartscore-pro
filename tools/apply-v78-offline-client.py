from pathlib import Path

path = Path("app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java")
text = path.read_text(encoding="utf-8")

old = '''        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectWebFixes(view);
                view.postDelayed(() -> injectWebFixes(view), 1000);
                view.postDelayed(() -> injectWebFixes(view), 3000);
            }
        });'''

new = '''        webView.setWebViewClient(new OfflineWebViewClient(
            this,
            this::handleUrl,
            (view, url) -> {
                injectWebFixes(view);
                view.postDelayed(() -> injectWebFixes(view), 1000);
                view.postDelayed(() -> injectWebFixes(view), 3000);
            }
        ));'''

if new in text:
    print("Offline WebView client already applied.")
elif old in text:
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print("Applied offline WebView client.")
else:
    raise SystemExit("Expected WebViewClient block not found; refusing unsafe patch.")
