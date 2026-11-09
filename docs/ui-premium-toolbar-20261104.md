# Premium a kompaktní herní lišta – 4. 11. 2026

Lokální větev `ui/readability-homepage-20261103`. Navazuje na předchozí redesign a nativní QA. Bez push, remote merge, deploy, App Store nebo Play změn.

## Změny

- Výběr jazyka je pouze v lobby. Samostatná horní lišta během hry byla odstraněna.
- Jedna společná herní lišta obsahuje Zpět, stav ukončení / počet kol, zvuk, hlas, Opakovat a v Premium také Uložit. Ikony mají lokalizované přístupné názvy, tlačítka zvuku/hlasu zachovávají stav. Na S23 má lišta 50 CSS px.
- Premium lobby má větší popis funkcí a vzhledu, barevná tlačítka mají 40 × 40 px. Všech pět motivů zůstalo zachováno.
- Kontrola náhozu odhalila použití pěti sloupců běžného číselníku i pro round-total. Opraven samostatný grid: displej přes celou šířku, čtyři řádky po třech klávesách a nápověda přes celou šířku. Klávesnice má 320 px a hráčská oblast využívá zbývající prostor se stávajícím scrollováním. Zvětšen displej a pomocný text. Scoring ani vstupní handlery se neměnily.
- Zdrojový regresní test upraven pro jediné tlačítko Zpět místo původních dvou; kontrola původního handleru a reklamní hranice zůstala.

## Fyzický S23

Samsung SM-S911B, 1080 × 2340, density 480, WebView 360 × 780 CSS px. Původní nainstalovaná aplikace byla prohlédnuta jako výchozí Premium vzhled; nebyla aktualizována ani měněna její data nebo nákup. Nové UI bylo ověřeno v odděleném balíčku `com.randis2288.dartscorepro.uireview` (DartScore UI TEST), s Premium nastaveným pouze jako testovací stav. Nejde o nové ověření Play Billing entitlementu.

Prošlo: Classic, Cricket, Around the Clock, Roulette a Roulette Double s šesti hráči, přechod na aktivního Test 6, celá aktivní karta a číselník, žádný výběr jazyka ve hře. Dále lobby, všech pět barev, popis Premium, pravidla, statistiky Přehled / Vzájemné zápasy s testovacími daty, Classic týmy a celý nához. Na finální opravě náhozu bylo zadáno 60: skóre 501 → 441, aktivní Test 2.

Snímky a měření: `build/premium-s23/`. Základní pět her a lobby mají stylesheet `index-D2rqP9UM.css`; po následné opravě pouze round-total jsou nové snímky `round.png`, `round-60.png`, `teams.png` se stylesheetem `index-KDB_Q0YB.css`. Oba stavy mají stejnou herní lištu a ostatní herní styly. Native screenshoty byly pořizovány až při ověřené testovací MainWebViewActivity v popředí. Společné URI schéma produkční a testovací instalace vyvolává systémový výběr aplikace; tento dialog byl zavírán a nebyl považován za herní UI.

## Čerstvé kontroly

| Kontrola | Výsledek | Důkaz |
| --- | --- | --- |
| 7 jazyků × 4 šířky × 2 režimy × 5 her × Chromium/WebKit | 560 prošlo | `build/premium-toolbar-results.json`, `build/premium-toolbar-matrix.txt` |
| Opravený celý nához, 7 jazyků × 4 šířky × Free/Premium × Chromium/WebKit | 112 prošlo | `build/premium-round-evidence/`, `build/premium-round-fixed-matrix.txt` |
| Pět Premium motivů × pět her × dva enginy, uložení/opakování/pokračování | 50 prošlo | `build/premium-evidence/results.json`, `build/premium-themes.txt` |
| Statistické obrazovky, jazyky a šířky | 56 prošlo | `build/premium-statistics.txt` |
| Herní průchody, šest hráčů, zvuk/hlas, pokračování, týmy a nához 60 | 10 prošlo | `build/premium-flows.txt` |
| iOS/Chromium čitelnost číslic | 72 prošlo | `build/premium-keypad.txt` |
| Focus/blur a obnova rozměrů | 40 scénářů, 600 měření | `build/premium-focus.txt` |
| Stávající unit testy | 35/35 | `build/premium-unit-tests.txt` |
| Web / izolovaný Android build / rozsah logiky / diff whitespace | prošlo | `build/premium-android-build.txt`, `build/redesign-invariants.txt` |

Úplná 560 matice předcházela opravě výhradně round-total; následně bylo ověřeno 112 jeho kombinací a na finálním sestavení znovu herní průchody a všech 50 Premium motivů. Matice pokrývá 320/360/393/430 px a cs/en/de/es/nl/ru/zh. Nativní S23 průchod je český, šířka 360 px. Poslední změna lišty nebyla znovu nativně nahrána do Appetize; iOS je pro tuto revizi ověřeno WebKitem. Nový Free banner nebyl znovu fyzicky testován na S10, který už nebyl připojen; Free rozložení je v automatizované matici. Tato kontrola není schválením vydání.

## Artefakty

- `build/ui-redesign-delivery/DartScore-UI-Premium-toolbar-TEST.apk` – finální izolovaná testovací aplikace, SHA256 `E312C59924C48983BD02951E6466DE5811133C58900F0362E2EBF687D4DD46E3`.
- `build/ui-redesign-delivery/DartScore-UI-Premium-toolbar-web.zip` – finální sestavený web v adresáři dist.
- `build/ui-redesign-delivery/UI-redesign-premium.patch` – lokální UI diff včetně předchozího redesignu.

Produkční Java/Swift, reklamy, nákupy, ukládání, scoring, pravidla a analytika nebyly upraveny. Generované sledované buildové soubory byly po archivaci vráceny na základ větve. Starší testovací artefakty zůstávají archivované a nejsou finálním sestavením této revize.
