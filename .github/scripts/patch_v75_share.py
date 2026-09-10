from pathlib import Path

# Version bump
p=Path('app/build.gradle')
s=p.read_text(encoding='utf-8')
s=s.replace('versionCode 74','versionCode 75',1)
s=s.replace('versionName "1.1.40"','versionName "1.1.41"',1)
p.write_text(s,encoding='utf-8')

# Native share bridge + production banner mode
p=Path('app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java')
s=p.read_text(encoding='utf-8')
old='private static final boolean FORCE_FREE_BANNER_TEST = true;'
new='private static final boolean FORCE_FREE_BANNER_TEST = false;'
if old not in s:
    raise SystemExit('FORCE flag anchor not found')
s=s.replace(old,new,1)

anchor='''    private void nativeToast(String message) {\n        runOnUiThread(() ->\n            Toast.makeText(this, message, Toast.LENGTH_LONG).show()\n        );\n    }\n'''
insert='''    private void shareAppNative(String title, String text, String url) {\n        String safeTitle = (title == null || title.trim().isEmpty()) ? "DartScore Pro" : title.trim();\n        String safeText = text == null ? "" : text.trim();\n        String safeUrl = (url == null || url.trim().isEmpty())\n            ? "https://play.google.com/store/apps/details?id=com.randis2288.dartscorepro"\n            : url.trim();\n\n        String message = safeText.isEmpty() ? safeUrl : safeText + "\\n" + safeUrl;\n\n        Intent sendIntent = new Intent(Intent.ACTION_SEND);\n        sendIntent.setType("text/plain");\n        sendIntent.putExtra(Intent.EXTRA_SUBJECT, safeTitle);\n        sendIntent.putExtra(Intent.EXTRA_TEXT, message);\n\n        try {\n            startActivity(Intent.createChooser(sendIntent, null));\n        } catch (Exception e) {\n            nativeToast("Sdílení nejde otevřít.");\n        }\n    }\n\n'''+anchor
if anchor not in s:
    raise SystemExit('nativeToast anchor not found')
s=s.replace(anchor,insert,1)

bridge_anchor='''        @JavascriptInterface\n        public void speak(String text, String lang) {\n            runOnUiThread(() -> speakNative(text, lang));\n        }\n'''
bridge_insert='''        @JavascriptInterface\n        public void shareApp(String title, String text, String url) {\n            runOnUiThread(() -> shareAppNative(title, text, url));\n        }\n\n'''+bridge_anchor
if bridge_anchor not in s:
    raise SystemExit('bridge speak anchor not found')
s=s.replace(bridge_anchor,bridge_insert,1)
p.write_text(s,encoding='utf-8')
print('v75 native share patch applied')
