# Roulette: kapitálky, stejné výšky a odezva

Lokálně na větvi ui/readability-homepage-20261103. Oba režimy Roulette a Roulette Double sdílejí úpravu.

- Všechna tři akční tlačítka používají text-transform:uppercase, bez změny původních překladů a akcí.
- Grid drží všechna tři tlačítka stejně vysoká podle nejvyššího obsahu. Minimum je 72 CSS px, výška je automatická. Na 320 px je sazba 14 px a vnitřní vodorovné okraje 1 px; německé AUSLOSEN a WECHSELN se tak vejdou bez osamoceného posledního písmene.
- Stávající společné pointer handlery zajišťují bílou odezvu včetně krátkého doběhu 120 ms, vrácení barev po puštění/zrušení a respektování deaktivovaných tlačítek. Přepínač vibrací zůstává respektován.
- Herní logika ani funkce Free/Premium nebyly změněny. Šipka zatím zůstává původní; čtyři nové varianty byly připraveny k výběru v chatu.

## Ověření

- Unit testy: 39/39 PASS, build/roulette-uppercase-unit.log.
- Web build: PASS, build/roulette-uppercase-web.log.
- Izolovaný Android build: PASS, build/roulette-uppercase-android.log.
- Jazyková/rozměrová matice: **224/224 PASS**, 0 selhání (7 jazyků × 4 šířky × Free/Premium × obě rulety × Chromium/WebKit); viz finální build/roulette-uppercase-evidence/results.json a build/roulette-uppercase-matrix.log. Kontroluje kapitálky, rovnost výšek, hranice textu/viewportu, bílou odezvu všech tří tlačítek, deaktivovaný Zásah a ukončení pressed po pointercancel. Matice používá řízený čas pro přeskočení opakované třísekundové animace; skutečné čekání losování je součástí fyzického testu.
- Fyzická S23: 8/8 kontrol, build/roulette-uppercase-s23/results.json; 360 × 780 CSS px, Premium jako testovací stav. Obě rulety, stejné výšky a kapitálky, všechna tři tlačítka bílé během skutečného dotyku. Testována výhradně com.randis2288.dartscorepro.uireview.

S10 není připojena; fyzický Free banner nebyl znovu ověřen. Produkční aplikace nebyla měněna. Bez commitu, push, nasazení či iOS ATT.

APK: build/ui-redesign-delivery/DartScore-UI-roulette-uppercase-TEST.apk.

SHA256 finálního APK: DA8558FEE562B9DA3FC97CD7AE8F161807BE4A4425694EF2DF5844EBD54EEE73.
