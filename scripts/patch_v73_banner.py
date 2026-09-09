from pathlib import Path

java_path = Path('app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java')
gradle_path = Path('app/build.gradle')
s = java_path.read_text(encoding='utf-8')
g = gradle_path.read_text(encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    return text.replace(old, new, 1)

# Version only: v72 -> v73.
g = replace_once(g, 'versionCode 72\n        versionName "1.1.38"', 'versionCode 73\n        versionName "1.1.39"', 'version bump')

# Platform insets API, no new dependency.
s = replace_once(s, 'import android.os.Bundle;\n', 'import android.os.Bundle;\nimport android.os.Build;\n', 'Build import')
s = replace_once(s, 'import android.view.View;\n', 'import android.view.View;\nimport android.view.WindowInsets;\n', 'WindowInsets import')

s = replace_once(
    s,
    '    private AdView adView;\n    private boolean bannerLoaded = false;\n',
    '    private AdView adView;\n    private boolean bannerLoaded = false;\n    private int bannerHeightPx = 0;\n    private int bottomSystemInsetPx = 0;\n',
    'banner inset fields'
)

s = replace_once(
    s,
    '''        root.addView(\n            adHost,\n            new FrameLayout.LayoutParams(\n                FrameLayout.LayoutParams.MATCH_PARENT,\n                FrameLayout.LayoutParams.WRAP_CONTENT,\n                Gravity.TOP\n            )\n        );\n        adHost.bringToFront();\n\n        setContentView(root);\n''',
    '''        root.addView(\n            adHost,\n            new FrameLayout.LayoutParams(\n                FrameLayout.LayoutParams.MATCH_PARENT,\n                FrameLayout.LayoutParams.WRAP_CONTENT,\n                Gravity.BOTTOM\n            )\n        );\n        adHost.bringToFront();\n\n        root.setOnApplyWindowInsetsListener((v, insets) -> {\n            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                bottomSystemInsetPx = insets.getInsets(WindowInsets.Type.navigationBars()).bottom;\n            } else {\n                bottomSystemInsetPx = insets.getSystemWindowInsetBottom();\n            }\n            updateBannerLayout();\n            return insets;\n        });\n\n        setContentView(root);\n        root.requestApplyInsets();\n''',
    'bottom host and insets listener'
)

s = replace_once(
    s,
    '''        if (!FORCE_FREE_BANNER_TEST && isPremium) {\n            adHost.setVisibility(View.GONE);\n            return;\n        }\n\n        adHost.setVisibility(View.VISIBLE);\n''',
    '''        if (!FORCE_FREE_BANNER_TEST && isPremium) {\n            adHost.setVisibility(View.GONE);\n            updateBannerLayout();\n            return;\n        }\n\n        adHost.setVisibility(View.VISIBLE);\n        updateBannerLayout();\n''',
    'premium/free layout refresh'
)

old_layout = '''        int adHeightPx = adSize.getHeightInPixels(this);\n\n        adHost.setLayoutParams(\n            new FrameLayout.LayoutParams(\n                FrameLayout.LayoutParams.MATCH_PARENT,\n                adHeightPx,\n                Gravity.TOP\n            )\n        );\n\n        adView = new AdView(this);\n'''
new_layout = '''        int adHeightPx = adSize.getHeightInPixels(this);\n        bannerHeightPx = adHeightPx;\n        updateBannerLayout();\n\n        adView = new AdView(this);\n'''
s = replace_once(s, old_layout, new_layout, 'banner host layout')

s = replace_once(
    s,
    '''            new FrameLayout.LayoutParams(\n                FrameLayout.LayoutParams.MATCH_PARENT,\n                adHeightPx,\n                Gravity.TOP\n            )\n        );\n\n        adView.loadAd(new AdRequest.Builder().build());\n    }\n''',
    '''            new FrameLayout.LayoutParams(\n                FrameLayout.LayoutParams.MATCH_PARENT,\n                adHeightPx,\n                Gravity.CENTER\n            )\n        );\n\n        adView.loadAd(new AdRequest.Builder().build());\n    }\n\n    private void updateBannerLayout() {\n        if (root == null || webView == null || adHost == null) return;\n\n        int visibleBannerHeight =\n            adHost.getVisibility() == View.VISIBLE ? bannerHeightPx : 0;\n\n        FrameLayout.LayoutParams hostParams = new FrameLayout.LayoutParams(\n            FrameLayout.LayoutParams.MATCH_PARENT,\n            visibleBannerHeight > 0\n                ? visibleBannerHeight\n                : FrameLayout.LayoutParams.WRAP_CONTENT,\n            Gravity.BOTTOM\n        );\n        hostParams.bottomMargin = bottomSystemInsetPx;\n        adHost.setLayoutParams(hostParams);\n\n        FrameLayout.LayoutParams webParams =\n            (FrameLayout.LayoutParams) webView.getLayoutParams();\n        webParams.bottomMargin = visibleBannerHeight > 0\n            ? visibleBannerHeight + bottomSystemInsetPx\n            : 0;\n        webView.setLayoutParams(webParams);\n    }\n''',
    'banner child and safe webview reservation'
)

java_path.write_text(s, encoding='utf-8')
gradle_path.write_text(g, encoding='utf-8')
print('v73 bottom banner patch applied')
