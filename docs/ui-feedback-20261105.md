# Android UI feedback – 5. 11. 2026

Lokální větev: ui/readability-homepage-20261103. Tento průchod navazuje na existující rozpracované změny. Bez commitu, push, nasazení nebo změn iOS ATT.

## Provedené změny

- src/App.jsx: jméno hráče již nespouští drag; dlouhé podržení zůstává výhradně na samostatném tlačítku ▲▼. Zachováno editování jmen, týmové přiřazení a klávesnicové přesouvání.
- src/ui/readability.css: jména i jejich vstupy používají touch-action:pan-y; samostatná ikonka ponechává vlastní dotykové přesouvání.
- Návrat do lobby: box 42–50 × 44–50 CSS px, šipka 34 px. Stavový sloupec začíná dále doprava; obsah má zarovnání ke středu. Počet kol má 16–20 px.
- Double, Triple a červené Zpět používají stejnou bílou pressed/active odezvu jako číslice včetně krátkého doběhu po puštění. Respektují existující globální přepínač vibrací.
- Zachováno předchozí zvětšení statistik obou rulet: oddělené řádky, 14–19 px, zalamování dlouhých překladů.
- qa/redesign-flows.mjs: regresní přesun nyní používá ikonku místo jména. qa/redesign-matrix.mjs: čekání na první vykreslení před vložením testovacích dat. Přidány cílené skripty qa/feedback-final-*.mjs.

## Čerstvé výsledky

| Kontrola | Výsledek | Důkaz |
| --- | --- | --- |
| Stávající unit testy | 39/39 PASS | build/feedback-final-unit.log |
| Web build | PASS | build/feedback-final-web.log |
| Oddělený Android debug build | PASS | build/feedback-final-android.log |
| Android unit úloha | BUILD SUCCESSFUL; NO-SOURCE, žádné nativní unit testy | build/feedback-final-android-tests.log |
| Horní lišta a funkční bílé klávesy; 7 jazyků × 4 šířky × Free/Premium × Classic/Roulette/Roulette Double | 168/168 PASS | build/feedback-final-toolbar.json |
| Premium: 5 motivů × 5 her × Chromium/WebKit; uložení/restart/pokračování | 50/50 PASS | build/feedback-final-premium.log, build/premium-evidence/results.json |
| Herní průchody včetně šestého hráče, zvuku/hlasu/vibrací, pokračování, týmů, editace jména a přesunu ikonou | 10/10 PASS | build/feedback-final-flows.log, build/redesign-flows/results.json |
| S23 Premium testovací stav | PASS | build/feedback-final-s23/results.json |
| S23: celý nához 60 a červené Zpět | PASS; 501 → 441; bílá rgb(255,255,255) | build/feedback-final-s23/round.json |

Cílená matice: 112/112 PASS (7 jazyků × 4 šířky × Free/Premium × Chromium/WebKit); Classic týmy/nához, Roulette Double, velikost návratu, odezva Zpět a čísel, držení jména bez reorderu a držení ikonky s aktivací reorderu. Důkaz: build/feedback-final-focused/results.json, build/feedback-final-focused.log. Široká matice: 560/560 PASS, 0 selhání (7 jazyků cs/en/de/es/nl/ru/zh × 320/360/393/430 px × Free/Premium × 5 her × Chromium/WebKit). Důkaz: build/feedback-final-matrix/results-webkit.json (souhrn obou enginů), build/feedback-final-matrix.log. Geometrie zahrnuje hranice viewportu, klávesnic, karet a přetečení testovaných popisků.

## Fyzická S23

SM-S911B, připojená přes ADB. Testována výhradně aplikace com.randis2288.dartscorepro.uireview, verze 1.1.69 / 103, WebView 360 × 780 CSS px. Premium bylo nastaveno jako izolovaný testovací stav; nebyl ověřován skutečný nákup. Testovací dialog souhlasu byl odmítnut.

Skutečná dotyková gesta přes CDP do WebView: tah přes vstup jména posunul lobby z 0 na 171,67 px a nezměnil pořadí. Podržení samostatného ▲▼ 500 ms a tah změnily pořadí. Všech pět herních režimů prošlo měřením viewportu a většího návratového tlačítka. Classic, Cricket a Around: Double, Triple a Zpět byly při drženém skutečném dotyku bílé. Náhozový číselník byl ověřen samostatně. Snímky jsou v build/feedback-final-s23; native-final.png je snímek celé fyzické obrazovky.

## Omezení

- S10 nebyla připojena. Free je ověřeno automatizovaně; nové fyzické ověření nativního Free banneru na S10 chybí.
- Automatizované geometrické kontroly nejsou ruční čtenářskou kontrolou všech textů a nejsou ověřením produkční reklamní výplně nebo Play Billing.
- Android sestavení hlásí stávající deprecated Gradle funkce; build prošel. Android unit úloha nemá testovací zdroje.
- První pokusy nad vývojovým serverem selhaly kvůli izolaci lokálního portu a vývojovému načítání fixture. Výsledky uvedené zde pocházejí ze sestaveného webu na portu 4196. Starší FAIL snímky ve složkách nejsou výsledkem finálního běhu; rozhodující jsou finální JSON a logy.

## Artefakt

build/ui-redesign-delivery/DartScore-UI-feedback-20261105-TEST.apk

SHA256: A94031B0D3A24079A7079D41924FFA8FCEEC863CFEB794EA9B63C7CFE8925522

Změny jsou pouze lokální. Produkční instalace nebyla aktualizována ani mazána.
