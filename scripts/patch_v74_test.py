from pathlib import Path

java_path = Path('app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java')
gradle_path = Path('app/build.gradle')

java = java_path.read_text(encoding='utf-8')
gradle = gradle_path.read_text(encoding='utf-8')

old = 'private static final boolean FORCE_FREE_BANNER_TEST = false;'
new = 'private static final boolean FORCE_FREE_BANNER_TEST = true;'
assert old in java, 'FORCE_FREE_BANNER_TEST source not found'
java = java.replace(old, new, 1)

old_insets = '''        root.setOnApplyWindowInsetsListener((v, insets) -> {\n            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                bottomSystemInsetPx = insets.getInsets(WindowInsets.Type.navigationBars()).bottom;\n            } else {\n                bottomSystemInsetPx = insets.getSystemWindowInsetBottom();\n            }\n            updateBannerLayout();\n            return insets;\n        });'''
new_insets = '''        root.setOnApplyWindowInsetsListener((v, insets) -> {\n            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n                int navBottom = insets.getInsets(WindowInsets.Type.navigationBars()).bottom;\n                int gestureBottom = insets.getInsets(WindowInsets.Type.mandatorySystemGestures()).bottom;\n                int cutoutBottom = insets.getInsets(WindowInsets.Type.displayCutout()).bottom;\n                bottomSystemInsetPx = Math.max(navBottom, Math.max(gestureBottom, cutoutBottom));\n            } else {\n                bottomSystemInsetPx = insets.getSystemWindowInsetBottom();\n            }\n            updateBannerLayout();\n            return insets;\n        });'''
assert old_insets in java, 'WindowInsets block not found'
java = java.replace(old_insets, new_insets, 1)

old_ad = 'adView.setAdUnitId(isDebug ? TEST_BANNER_ID : PROD_BANNER_ID);'
new_ad = 'adView.setAdUnitId((isDebug || FORCE_FREE_BANNER_TEST) ? TEST_BANNER_ID : PROD_BANNER_ID);'
assert old_ad in java, 'Ad unit selection not found'
java = java.replace(old_ad, new_ad, 1)

assert 'versionCode 73' in gradle and 'versionName "1.1.39"' in gradle
gradle = gradle.replace('versionCode 73', 'versionCode 74', 1)
gradle = gradle.replace('versionName "1.1.39"', 'versionName "1.1.40"', 1)

java_path.write_text(java, encoding='utf-8')
gradle_path.write_text(gradle, encoding='utf-8')
print('v74 test patch applied')
