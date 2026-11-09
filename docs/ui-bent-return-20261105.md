# Zvolená šipka: Zalomený návrat, maximální velikost

Lokální větev ui/readability-homepage-20261103. Na výslovné přání uživatele nahrazen původní textový znak šipky kreslenou zalomenou návratovou ikonou. Ikona vyplňuje dostupný obsah boxu, má silný zaoblený tah a geometrický střed je shodný se středem tlačítka. Rozměry boxu a ostatní prvky lišty jsou zachovány.

Změněno pouze src/App.jsx a src/ui/readability.css. Zachován původní handler návratu, lokalizovaný přístupný název, Premium/Free i předchozí úpravy tlačítek rulet.

Ověření: 39/39 unit PASS; web build PASS; izolovaný Android assembleDebug PASS. Geometrická a funkční matice: 280/280 PASS, 0 selhání. Výsledky v build/bent-return-evidence/results.json (7 jazyků × 4 šířky × Free/Premium × 5 her). Kontroluje střed v obou osách, bezpečný odstup kresby od rámečku, využití vnitřní plochy, nepřekrývání stavového textu a návrat do lobby.

S23: finální testovací aplikace com.randis2288.dartscorepro.uireview aktualizována, geometrická odchylka středu menší než 0,001 CSS px v obou osách, návrat do lobby PASS. Důkaz: build/bent-return-s23/results.json; snímek build/bent-return-s23/header.png. Nainstalovaný stylesheet index-hQ2v8GZY.css.

APK: build/ui-redesign-delivery/DartScore-UI-bent-return-TEST.apk. SHA256 4BC544C3F7130712BB112EC50A4AA86F514A77C7E16DA1D254E12B547857A66E.

S10 nebyla připojena. Nákupy a nativní Free reklamy nebyly znovu ověřovány. Produkční instalace nebyla nahrazena. Bez commitu, push, nasazení nebo zásahu do iOS ATT.
