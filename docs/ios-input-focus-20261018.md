# iOS: zvětšení po klepnutí do jména hráče

- Větev: `test/ios-input-focus-20261018`.
- Výchozí commit: `6b4c769`, větev buildu 7 `test/x01-score-clipping-20261018`.
- Hlášené zařízení: fyzický iPhone, TestFlight 1.1.63 (7).

## Zjištění a oprava

Jméno hráče je `<input className="input">` bez atributu `type`.
Pravidlo `.input,select` mu dávalo 14 px. To odpovídá hypotéze automatického
přiblížení iOS při focusu; na tomto Windows prostředí nelze původní nativní
autozoom reprodukovat. Test s původním CSS prokazatelně selže na vypočtených
14 px, opravené pole má 16 px před focusem i během editace.

`src/app.css` nyní nastavuje 16 px pro textové, vyhledávací, kontaktní,
heslové a číselné inputy, inputy bez typu a textarea. Pravidlo platí i pro
Android, aby byla editovatelná pole konzistentní. Checkboxy a vlastní dropdowny
se nemění. Herní logika, nativní kód a verze buildu se nemění.

Viewport zůstává `width=device-width, initial-scale=1.0, viewport-fit=cover`.
Nepřidává se `user-scalable=no`, limit měřítka, transformace ani nucený scroll.
Stávající obsluha `resize` přepočítává `--vh` z `innerHeight`; nepřebírá
zmenšenou šířku/height z přiblíženého visualViewportu. Focus vybírá jméno,
blur nemění viewport. Testy nepotvrdily potřebu dalšího JS zásahu.

Kontext přístupnosti: [WebKit – New Interaction Behaviors in iOS 10](https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/).

## Čerstvé ověření

1. `npm ci --ignore-scripts --no-audit --no-fund`, `npm test`: 21/21.
2. `npm run build`: úspěch. Browserové testy běžely proti tomuto sestavení.
3. `qa/input-focus-viewport.mjs`: WebKit 26.5 a Chromium, šířky
   320/375/390/430 px, X01/Cricket/Around/Roulette/Roulette Double.
   Celkem 40 scénářů, 120 editací s touch focusem, zadáním jména a blurem,
   600 měření. Všechna jména mají 16 px, měřítko 1, bez vodorovného přetečení.
   Po každém cyklu se zachová scroll i offset viewportu a obnoví výška
   s tolerancí 1 px pro subpixelové zaokrouhlení. Jméno se přenese do hry.
4. Původní stylesheet z `git show HEAD:src/app.css` přes
   `DARTSCORE_FOCUS_CSS` selhal na očekávaném fontu `[14,14]`.
   Tento baseline prokazuje detekci malé velikosti textu, nikoli nativního zoomu.
5. `qa/ios-webkit-ui.mjs`: čtyři šířky, lobby, X01, změna skóre, meze prvků;
   také kontrola Android webového obsahu. Vše prošlo.
6. `qa/ios-webkit-modes.mjs`: osm kombinací ostatních režimů a 320/390 px.
   Původní harness předpokládá anglické názvy; první běh narazil na jiný jazyk.
   Kopie harnessu s explicitním `en-US` prošla všemi scénáři.
7. `qa/x01-score-clipping.mjs`: 16 kombinací WebKit/Chromium, všech šířek,
   Free/Premium. Bez problémů ořezu skóre.

Výsledky a screenshoty: `build/input-focus-evidence/`, baseline:
`build/input-focus-baseline/`. Cesty nejsou součástí změny zdrojového kódu.
Starší QA skripty byly spuštěny z dočasných kopií s cestou k dostupnému
Playwrightu a samostatným výstupem, aby se nepřepsaly předchozí důkazy.
Repo obsahuje sledované `node_modules` a `dist`; po ověření jsou obnoveny
do původního stavu. Nové sestavení vyžaduje opět `npm ci` a `npm run build`.

## Opakování testu

S dostupným balíčkem Playwright a nainstalovanými WebKit/Chromium spusťte
`npm run build`, lokální `npm run preview` a
`node qa/input-focus-viewport.mjs`. URL lze změnit přes `DARTSCORE_UI_URL`.
Volitelný `DARTSCORE_PLAYWRIGHT_MODULE` určuje import dostupné instalace,
`DARTSCORE_FOCUS_OUTPUT` výstup a `DARTSCORE_FOCUS_CSS` původní stylesheet
pro negativní kontrolu proti sestavené aplikaci.

## Neověřené prostředí a další kontrola

Desktopový WebKit s mobilní emulací neotevírá systémovou iOS klávesnici
a neimplementuje celý iOS mechanismus focus zoomu. Zmenšení výšky na 500 px
a návrat na 844 px jsou explicitně simulovaný test rozložení.
Lokální ani připojený počítač není macOS; Xcode simulátor není dostupný.
Chromium používá Android user agent a mobilní/touch emulaci, nejde o test
nové instalace na fyzickém Androidu. Produkční instalace nebyla měněna.

Po samostatně schválené přípravě iOS testovacího buildu je nutné na fyzickém
iPhonu alespoň třikrát otevřít klávesnici klepnutím do jména, upravit jméno,
zavřít klávesnici i přes její tlačítko Hotovo a přejít do každého režimu.
Ověřit zachovanou šířku, návrat po klávesnici a funkční ruční pinch zoom.
Do té doby je oprava ověřena na úrovni CSS a browserového chování,
nikoli jako potvrzené odstranění chyby ve fyzickém WKWebView.

Žádný merge, push, upload buildu 8, App Review submission ani Android
produkční zásah nebyl proveden.
