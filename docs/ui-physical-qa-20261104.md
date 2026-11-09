# UI redesign – doplnění nativní kontroly 4. 11. 2026

Navazuje na `ui-redesign-20261103.md`. Testování nezměnilo produktový kód, reklamní konfiguraci, nákupy ani produkční aplikaci. Větev zůstává lokální, bez push/merge/deploy; Apple Review nebylo měněno.

## Samsung S10

SM-G973F, připojený přes ADB. Izolovaná aplikace `com.randis2288.dartscorepro.uireview`, Free režim se skutečně zobrazeným nativním testovacím bannerem. WebView 411 × 747 CSS px při banneru; fyzický snímek 1080 × 2280. Aktuální UI stylesheet `index-9gcrHqym.css`.

Všech pět her prošlo s šesti hráči. Aktivní Test 6 se automaticky posunul do viditelné oblasti; existující posouvání zůstalo funkční. Klávesnice/tlačítka nekolidovala s bannerem. Cricket po třetí patnáctce zobrazil zelený kruh i křížek. DOM kontrola nenašla přetečení kláves. Screenshot byl pořízen až po ověření, že v popředí je skutečná MainWebViewActivity testovací aplikace.

Platné důkazy v `build/physical-qa-20261104/` (PNG + JSON + XML):

| Hra | Základní/uzavřený stav | Aktivní šestý hráč |
| --- | --- | --- |
| Classic | `classic-visible` | `classic-sixth-visible` |
| Cricket | `cricket-closed-visible` | `cricket-sixth-visible` |
| Around the Clock | `around-visible` | `around-sixth-visible` |
| Roulette | `roulette-visible` | `roulette-sixth` |
| Roulette Double | `roulette-double-visible` | `roulette-double-sixth-verified` |

Přerušení testu: při souběžné instalaci produkční a testovací aplikace zobrazoval Android výběr aplikace pro společné URI schéma dartscorepro. Tyto systémové dialogy byly zavřeny, nepočítají se jako úspěšné snímky UI. Některé Unity interstitialy měly dlouhé načítání; jeden běh vyžadoval restart pouze testovací aplikace. Nejde o důkaz bezchybného reklamního SDK nebo produkční výplně. Starší snímky bez výše uvedených názvů mohou obsahovat dialog či reklamu a nejsou akceptačním důkazem.

## iOS přes Appetize

iPhone 14 Pro, iOS 17.2; build Appetize `b_3mgkmq4cmm4tomyikgkfqti2bu`. Nahrán `DartScore-UI-iOS-Verified.zip`: aktuální sestavené webové UI vložené do dostupného nativního simulátorového obalu 1.1.64 (10). Všech 155 původních nativních položek má shodný hash; změněna pouze webová složka public. ZIP má 181 čitelných položek. Není to nově zkompilovaný nativní build 11 a nenahrazuje jeho ověření.

Všechny hry otevřeny se šesti hráči a nativním testovacím Free bannerem. Viditelné ovládání zvuku/hlasu zůstalo v záhlaví. Classic, Around a Cricket měly celou číselnou klávesnici nad bannerem; rulety měly čitelné dvouřádkové Switch player. Cricket po třech zásazích zobrazil zelený uzavřený znak. Roulette losovala cíl; Roulette Double přepnula postupně na hráče 6 a automaticky zobrazila celou aktivní kartu nad bannerem.

Nativní softwarová klávesnice byla otevřena v poli jména, jméno bylo upraveno. Po Done se obnovila horní lišta, rozložení i banner. Během editace se obsah posouval směrem k horní stavové oblasti; ověřený ustálený stav po zavření klávesnice je správný. Přenos kláves/obrazu měl zpoždění, proto se netvrdí přesná shoda zamýšleného testovacího jména. Apple ID výzva byla zrušena bez přihlášení nebo nákupu. Byl zobrazen také skutečný testovací interstitial; celou cestu po jeho zavření přerušil tříminutový limit Appetize, následný průchod proběhl v nové relaci.

JPEG důkazy ve stejné složce: `ios-keyboard`, `ios-keyboard-recovered`, `ios-six-players`, `ios-classic`, `ios-cricket-closed`, `ios-around`, `ios-roulette`, `ios-roulette-double`, `ios-sixth-active`, `ios-interstitial`.

## Rozsah a zbývající omezení

Sedm jazyků, šířky 320/360/393/430 a Free/Premium byly ověřeny dřívější automatizovanou maticí Chromium/WebKit (280 + 280 případů), nikoli každá kombinace znovu na nativním zařízení. Tento nativní průchod byl S10 česky a Appetize anglicky. Premium nákup nebyl proveden. S23 ani fyzický iPhone nebyly testovány. Nejnovější nativní iOS obal buildu 11, opakovaná aktualizace/start a spolehlivost návratu ze všech reklam zůstávají před vydáním k ověření. Žádný z těchto výsledků není schválením publikace.
