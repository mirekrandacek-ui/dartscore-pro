> DOKONČENO: Finální AAB 2.07 (107) je připravený. Aktuální stav a výsledky: internal-aab-v107-2.07-20261106.md. Níže zůstává časový záznam předchozího preflightu pod 106.

# Interní AAB – sjednocení a release preflight, 6. 11. 2026

## Stav

Sjednocení a technické ověření podepsaného release jsou hotové. **Finální číslo nového sestavení čeká na potvrzení nejvyššího použitého versionCode v Google Play Console.** Lokálně nejvyšší předchozí release je 106 / 1.1.72. Zkušební preflight sestavení zatím používá toto číslo a není určeno k nahrání jako nová verze. Finální číslo, odpovídající versionName a webové APP_VERSION musí být sjednoceny až po potvrzení. AAB nebylo nahráno.

Kontrola Play Console přes Windows byla systémem ukončena, protože neuměl dostatečně spolehlivě ověřit aktuální adresu prohlížeče. Další automatické UI pokusy nebyly prováděny. Uživateli byla položena otázka na nejvyšší kód a volnost 107.

## Integrovaný rozsah

Lokální větev ui/readability-homepage-20261103. Přeneseno z lokálního android-startup-fix / v106:

- UMP launcher vytváří nativní obsah před prvním přístupem SDK k oknu.
- Přímé nativní bridge pro analytiku a reklamy; při ukončení hry se kvůli těmto událostem neopouští herní WebView. Reklamní Activity nezmizí před návratem SDK.
- Bezpečné okraje Android 15/16 včetně výřezů a nativního banneru; web již tyto okraje nepřičítá podruhé.
- Liftoff/Vungle bidding závislost, AndroidX Core, novější browser helper, AGP 9.3.3 / Gradle 9.5.0 a R8/resource optimalizace. Zachování reflektivního konstruktoru WorkDatabase_Impl.
- Zachováno schválené portrétní chování telefonů; nebylo plošně převzato v106 odstranění všech orientačních omezení. Přidáno resizeableActivity. Plná tabletová/landscape regrese není tímto průchodem potvrzena.
- Zachována ochrana ostatních vlastních deeplinků na vlastní package. Odstraněna neaktuální deklarace browser-helper fallback Activity.

Schválené implementace Lobby/Game a celý src/ui/readability.css jsou proti preintegračnímu stavu beze změny (při normalizaci konců řádků). Metoda schváleného HEAVY_CLICK je zachována beze změny kódu. Důkaz: build/internal-aab-20261106/preserved-ui.json. Původní zdroje jsou zálohované v preintegration/.

## Ověření

- 45/45 unit testů PASS, unit-integration.log. Zahrnuje přenesené testy UMP startu a skutečného JS→Android směrování reklam/analytiky.
- Web build a izolovaný debug Android build PASS.
- Podepsané assembleRelease + bundleRelease s R8 PASS, signed-preflight.log (2m49s). Původní upload klíč použit přímo z existujícího úložiště; soukromý klíč ani hesla nebyly kopírovány do projektu nebo logů.
- Google bundletool 1.18.3 validate PASS, bundle-validation.log. Package com.randis2288.dartscorepro, target SDK 36. Bundle obsahuje lokální offline web.
- jarsigner potvrzuje podpis. Certifikát SHA256 169a3816713c09a26425223f7a5e75096d9686af1a3b773049f6569c6b451792 odpovídá dřívějšímu upload certifikátu v106. artifact-preflight.json a certificate-public.txt.
- R8 zachoval metody JavascriptInterface hapticTap, requestInterstitialEvent, logAnalyticsEvent i WorkDatabase_Impl; ověřeno v mapping.txt.
- Čistý izolovaný Android 16 emulátor s novými daty pouze v build/internal-aab-20261106/emulator. Původní data Země Město AVD ani data S23 nebyla měněna.
- Podepsaný release: první spuštění zobrazilo UMP, po odmítnutí přešlo do MainWebViewActivity. Ve skutečném release prošlo Classic 3×20, skóre 501 → 441 a Last throw 60, a návrat do lobby. UI dumpy a snímky jsou v emulator/.
- 5/5 dalších studených startů PASS, bez app crash, emulator/cold-starts.json a crash-final.txt.

## Artefakty a zbylé kroky

Preflight verze 106: build/internal-aab-20261106/preflight-v106/. **Nejde o finální novou verzi k uploadu.** AAB SHA256 1c788abcfa3388714d7cc4cd25705c4a9912dc9219bed1f68a074bf9b7143ebb.

Zbývá potvrdit volný vyšší versionCode v Play Console, sjednotit novou verzi také ve webovém APP_VERSION, znovu sestavit/ověřit finální podpis a předat pojmenovaný AAB s kontrolním součtem. Podepisovací helper build/internal-aab-20261106/build-signed.ps1 neobsahuje hesla, načítá původní klíč jen v paměti procesu.

S23 se během přípravy odpojila, a nově sjednocený základ proto nebyl nově fyzicky ověřen na S23/S10. Předchozí fyzické odsouhlasení UI a silného kliku před sjednocením tím není vydáváno za nový release test. Skutečné nákupy, obnova a reálné dokončené Liftoff zobrazení zůstávají předmětem interního Play testu.

Bez commitu, push, nasazení, uploadu do Play, změny produkční instalace nebo iOS ATT. Předchozí rozpracované změny iOS nebyly upravovány.
