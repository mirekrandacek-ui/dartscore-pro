# Nové statistiky v odděleném UI TEST APK

Dokončeno lokálně 6. 11. 2026 na Randy. Větev ui/readability-homepage-20261103. Bez commitu, push, merge, uploadu, nového AAB nebo změny produkce.

## Změny

- Přenesen samostatný StatisticsDashboard, StatisticsPlayerPicker, statisticsCopy a statisticsHistory ze sousedního checkoutu dartscore-pro. Původní vložený panel odstraněn. Přidané styly odpovídají současné tmavé aplikaci, zachovávají větší čitelné texty. Historický finální vizuální návrh nebyl v odkazované konverzaci dostupný; nejde o potvrzení pixelové shody s ním.
- Vyhledávání hráčů včetně hledání bez diakritiky, přehled a H2H, historie s postupným zobrazením, export, skrytí/obnovení hráčů, potvrzené mazání a vrácení posledního smazání.
- Původní finishedGames zůstává datovým formátem; při pouhém otevření se historie nemigruje ani nepřepisuje. Ukládání nového zápasu používá appendMatch a už neodřezává historii na 200 položek. Starší již odstraněná data tím nelze obnovit. Chyba čtení nebo zápisu nesmí přepsat původní historii.
- Hlasová ikona v herní liště jen v Classic. Domovská lišta zachována.
- Snímky původních upravovaných souborů před přenosem: build/statistics-transfer-20261106/before/.

## Výstup

build/ui-redesign-delivery/DartScore-UI-statistics-20261106-TEST.apk

- Package com.randis2288.dartscorepro.uireview, název DartScore UI TEST; verze 107 / 2.07. Stejné číslování jako předchozí lokální AAB neznamená stejný obsah.
- 21 535 232 bajtů. SHA256 5B1D97FC5A2BE6566FE43E4EBAEE18A72DA84BABD79778744C998CFE9ECF441F.
- apksigner verify PASS, Android Debug certifikát SHA256 deedcb95ab49ad22f23667757415688556fcc51284ac45ecc6a4f9acdcda8463.
- aapt potvrdil samostatný package a název. Aktivní JS obsahuje stats-player-picker a dartscore.stats.lastDeletion.v1. Všechny aktuální JS/CSS z dist mají shodný SHA256 jako jejich vložené soubory v APK.
- Původní release-v107/DartScorePro-v107-2.07.aab nebyl přestavěn a tyto nové statistiky nadále neobsahuje.

## Čerstvé ověření

- npm test: 49/49 PASS. Nové behaviorální testy: více než 200 starých zápasů, nezapisující čtení/skrytí, zachování nového zápasu při vrácení mazání, chyba kvóty archivu, neplatná historie, odlišení H2H od týmů a více hráčů.
- npm run build PASS; gradlew --offline --init-script build/ui-test.init.gradle :app:assembleDebug PASS.
- qa/statistics-transfer.mjs: Chromium i WebKit, šířky 320 a 393, 4/4 PASS. Na syntetických 260 zápasech ověřeno hledání, skrytí/obnovení hráče, zrušení mazání bez změny historie, smazání a vrácení 260 zápasů, zachování po reloadu a nepřetékání přehledu/H2H. Snímky a results.json v build/statistics-transfer-20261106/.
- qa/statistics-voice.mjs: všech pět režimů v Chromiu i WebKitu, 10/10 PASS, ikona jen Classic a funkční přepnutí.
- qa/redesign-flows.mjs: 10/10 PASS. Šest hráčů/automatická viditelnost, zvuk/hlas/vibrace, návrat a pokračování, součet kola 60, týmy, přejmenování a pořadí.
- Finální prohlížečové testy běžely přes vite preview nad dist. Dřívější pokusy přes vývojový Vite vykazovaly přepis fixture lobby při opakované inicializaci; tento výsledek není vydáván za produktovou regresi finálního sestavení. Síťové přístupy mimo 127.0.0.1 byly v testech blokované.

## Omezení a ruční ověření

Nové APK nebylo v této práci nainstalováno na fyzický telefon. Není to ověření skutečných dat uživatelova telefonu, nativního exportu přes Android WebView, nákupů, reklam ani Play distribuce. Export v nativní WebView zůstává zvlášť k ručnímu ověření. Široká matice všech jazyků a nativních zařízení nebyla opakována.

Další krok: aktualizovat pouze existující DartScore UI TEST, zkontrolovat skutečnou historii a vzhled panelu, vyzkoušet Classic a jeden neklasický režim. Produkční aplikaci neodinstalovávat. Teprve po uživatelském odsouhlasení připravit nový AAB a ověřit obsah; Play upload vyžaduje samostatný souhlas.
