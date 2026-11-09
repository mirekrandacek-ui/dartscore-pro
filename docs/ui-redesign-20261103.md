# DartScore Pro – UI redesign, 3. 11. 2026

Pracovní větev: `ui/readability-homepage-20261103`, samostatná kopie `dartscore-ui-redesign`.

Uživatelem schválený lokální základ je merge commit `61c0d5bbdcfb12bebaed9e8cf9ee07f6490abfaa`: main `d8cb060` + iOS Apple Review větev `2d40ec9`. Žádný push, PR, merge na GitHubu, deploy, TestFlight ani Apple/Play publikace neproběhly. UI změny zůstávají lokálně necommitnuté nad tímto základem. Odeslaný Apple build 11 není upraven.

## Změny

- Homepage: první ovládací prvek je jazyk, pevné záhlaví jazyk–zvuk–hlas–sdílení, bez názvu aplikace a ručního tlačítka hodnocení. Sdílení používá původní obsluhu i analytickou událost.
- Kompaktní Režim/Legy/Sety; Pořadí/Robot a Typ počítání/Dohrávat kolo; Start/Pokračovat vedle sebe; zachované týmy, přejmenování, přesouvání, mazání a přidání hráčů.
- Premium ovládání přesunuto nad Pravidla. Nákupy, obnovení nákupu, motivy a podmínky zobrazení zůstaly zachované.
- Classic/Around/Roulette: větší jména a pomocné údaje; Classic větší Sety/Legy, hody, poslední hod a checkout. Velké skóre zůstává zachované. Karty zůstávají v původní posuvné oblasti.
- Cricket: větší jména, body, cíle a ovládání; třetí zásah tvoří zelený SVG kruh se zeleným křížkem. První / a druhý ✕ zůstávají původní.
- Roulette: větší tlačítka s povoleným zalamováním dlouhých překladů.
- Větší texty herního záhlaví a statistik. Zvuk a hlas dostupné během každé hry.
- Safe-area spodní okraj zachovaný i bez iOS banneru. Mřížka klávesnice používá řádky s nulovou minimální výškou, aby poslední řádek nevyrostl mimo panel. Poslední iOS opravy velikosti číslic jsou zachované.

## Čerstvé ověření

| Kontrola | Výsledek |
|---|---|
| Node regresní testy | 35/35 PASS |
| Web build Vite | PASS |
| Android assembleDebug, oddělená testovací aplikace | PASS |
| UI matice Chromium | 280/280 PASS |
| UI matice WebKit | 280/280 PASS |
| Statistiky: přehled + H2H | 56/56 jazykových/rozměrových kombinací PASS |
| Funkční průchody Chromium/WebKit | 10/10 PASS |
| Původní test velikosti a ořezu číslic | 72/72 PASS |
| Focus/edit/blur a obnova výšky | 40 scénářů, 600 měření PASS |
| Shoda ne-UI logiky s lokálním základem | PASS |

UI matice: cs/en/de/es/nl/ru/zh, šířky 320/360/393/430 px, všech pět her, 6 hráčů, Free/Premium. Free viewport 667 px představuje zmenšenou dostupnou plochu po rezervaci banneru; Premium 740 px. Test přidává horní/spodní bezpečný okraj 20/24 px. Kontroluje přetečení stránky, ovládání, klávesnici, karty, skutečnou velikost jmen a údajů a uzavření Cricketu.

Funkční průchody ověřily skutečné přepnutí až na šestého hráče a jeho automatickou viditelnost v Classic/Cricket/Around, přepínače zvuku/hlasu, návrat a pokračování, společný řádek Start/Pokračovat, editaci a pořadí hráčů, týmy a zadání 60 přes součtovou klávesnici.

Původní kontrola číslic měří šířku a skutečnou výšku znaků v tlačítkách při výškách 667/844 px a šířkách 320/360/375/390/393/430 px. Focus test používá 320/360/393/430 px; změna výšky okna není důkazem fungování skutečné iOS klávesnice.

Porovnání zdrojů potvrzuje beze změny veškerou logiku před kořenovým renderem: scoring, pravidla, reklamy, Premium, ukládání a analytiku. Původní `cardRefs` + `scrollIntoView` blok je přesně zachovaný. Ve statistikách se měnily pouze třídy a velikosti fontů, nikoli výpočty.

## Zařízení a omezení

S10 SM-G973F je dostupný. Byl nainstalován samostatný balíček `com.randis2288.dartscorepro.uireview` označený DartScore UI TEST. Play aplikace a její data nebyly nahrazeny. Testovací Gradle init mění jen applicationId, název a identifikátor FileProvideru a používá existující debug testovací reklamu. Produkční nativní zdroje ani reklamní nastavení redesign nemění.

Na S10 bylo nové homepage fyzicky zachyceno se skutečným testovacím bannerem (`build/s10-current.png`). Classic se šesti hráči prošel měřením skutečného WebView; při tomto snímku se banner právě nezobrazoval. Kompletní fyzický průchod všech her s trvale zobrazeným bannerem zatím není potvrzen. Během aktualizace testovacího APK se objevil nativní pád ConsentLauncherActivity „Window couldn't find content container view“. Po čisté instalaci testovací aplikace UI naběhlo; oprava nativního kódu nebyla provedena. Souběh testovací a Play aplikace také otevřel systémový výběr aplikace pro společné schéma. Tento stav není chyba layoutu a vyžaduje samostatné doověření distribuce.

S23 nebyl připojen. Nativní iPhone/iOS simulátor ani Xcode nebyly dostupné; iOS je zde ověřeno WebKitem a statickými/regresními testy, nikoli nativním sestavením. Nákupy Premium a skutečné produkční reklamní doručení nebyly prováděny. Testovací Android manifest zdědil versionCode 103 / 1.1.69 z vybraného main základu; toto APK není produkční 1.1.72 ani kandidát k vydání.

## Artefakty

- `build/ui-redesign-delivery/DartScore-UI-TEST.apk` – oddělená debug aplikace, SHA256 `F3CF354A8352FCF8024E9422F00683E701459B1EC945E2A8E62C460F77F14467`.
- `build/ui-redesign-delivery/DartScore-UI-web.zip` – sestavený web, bez publikace.
- `build/redesign-evidence/` – matice a snímky všech her.
- `build/redesign-flows/`, `build/redesign-statistics/`, `build/ios-keypad-evidence/`, `build/input-focus-evidence/` – podrobné výsledky.
- `build/redesign-invariants.txt` a `build/redesign-unit-tests.txt` – kontrola rozsahu a regresní výsledky.

Před vydáním je potřeba dokončit fyzický regresní průchod se skutečným bannerem, ověřit opakovaný nativní start/aktualizaci a nativní iOS klávesnici. UI je připravené k revizi, nikoli označené jako schválené k publikaci.

## Spuštěné kontroly

`node --test tests/*.test.mjs`; `node node_modules/vite/bin/vite.js build`; `./gradlew.bat :app:assembleDebug --offline --no-daemon --console=plain`; oddělený balíček navíc používá `--init-script build/ui-test.init.gradle`.

Prohlížečové kontroly: `node qa/redesign-matrix.mjs`, `node qa/redesign-flows.mjs`, `node qa/redesign-statistics.mjs`, `node qa/ios-keypad-labels.mjs`, `node qa/input-focus-viewport.mjs`. Preview běželo na portu 4193; externí Playwright runtime byl nastaven přes `DARTSCORE_PLAYWRIGHT_MODULE` a prohlížeče přes `PLAYWRIGHT_BROWSERS_PATH`. Matice, statistiky a funkční průchody blokují externí webové požadavky; nejde o důkaz produkční reklamní výplně.

Sestavený web je v ZIP artefaktu. Původní sledované generované soubory v `dist`, `node_modules`, `.gradle`, lokální SDK cesta a generovaný manifest zůstávají mimo UI diff a po ověření byly v pracovní kopii obnoveny na základ větve. Pro další preview je potřeba web znovu sestavit nebo rozbalit hotový ZIP.
