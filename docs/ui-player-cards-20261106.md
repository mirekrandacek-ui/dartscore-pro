# Čitelnější karty Classic a Roulette – 6. 11. 2026

Lokálně na větvi ui/readability-homepage-20261103. Podklad z Disku: [Screenshot_20261106_000141_DartScore UI TEST.jpg](https://drive.google.com/file/d/1W72b4DsdjSfyAi6KzZV9wbU6XODRRG-E/view). Referenční obrázek byl stažen a vizuálně prohlédnut; lokálně build/card-readability-20261106/drive-reference.jpg.

## Změny

- Roulette i Roulette Double: společná velikost 22–27 CSS px pro jméno, body, počet šipek i poslední hod. Jméno a body jsou větší, pravé statistiky mají stejnou velikost. Zůstává zalamování dlouhých překladů a bezpečné řádkování pro diakritiku.
- Classic jednotlivci i týmy: jméno vlevo a dosavadní velikost skóre vpravo nahoře. Pod nimi dvousloupcový přehled: počet šipek / průměr, sety a legy / poslední hod. Jméno 22–28 px, informace 16–20 px. Sety a legy se zalamují po celých údajích, nikoli uprostřed zlomku.
- Poslední hod je přemístěný z dolního samostatného řádku do přehledu. Dole jsou pouze tři boxy hodů. Karta může podle obsahu mírně růst do výšky; scroll hráčské oblasti zůstal zachován.
- Týmy zachovávají seznam členů i zvýraznění aktivního hráče. Around a Cricket nejsou novým layoutem cíleny. Herní logika, klávesnice, nákupy, reklamy, motivy a již schválená šipka/tlačítka rulet zůstávají zachované.

## Čerstvé ověření

- Unit: 39/39 PASS, build/card-readability-20261106/unit.log.
- Web build: PASS, build/card-readability-20261106/web.log.
- Izolovaný Android debug build: PASS, build/card-readability-20261106/android.log.
- Matice: 560/560 ověřených kombinací, souhrn build/card-readability-20261106/verified-results.json. Široký běh původně našel 14 přetečení výšky jmen členů týmu ve WebKitu při 430 px. Po výhradní změně line-height na .classicMembers prošlo znovu všech 112 týmových kombinací; dalších 448 kombinací z předchozího běhu bylo beze změny a prošlo. Jednotlivé zdroje: results.json / matrix.log a final-teams/results.json / teams-matrix.log. Sedm jazyků cs/en/de/es/nl/ru/zh, šířky 320/360/393/430 px, Free/Premium, Chromium/WebKit; Classic po šipkách, Classic týmy, Classic celý nához a obě rulety. Kontroly hranic karet/viewportu, přetečení a výšek textů, shody velikostí u rulet, pořadí informací, tří dolních boxů a scoringu celého náhozu 60.
- Fyzická S23: 5/5 PASS; Classic jednotlivci/týmy/nához, obě rulety, šest hráčů, Bartoloměj. Skóre po 60: 501 → 441, přesunutý Poslední hod: 60. Návrat do lobby po každém režimu. Důkaz: build/card-readability-20261106/s23/results.json a s23.log. Snímky a samostatné náhledy karet jsou v témže adresáři.

## Rozsah a omezení

Fyzicky ověřena testovací aplikace com.randis2288.dartscorepro.uireview na SM-S911B, 360 × 780 CSS px, Premium jako testovací stav. Nejde o nové ověření Play Billing. S10 není připojena, nové fyzické ověření Free banneru chybí; Free geometrie je v automatizované matici. Dřívější FAIL snímky z vývoje řádkování nejsou finálním výsledkem; rozhodující jsou poslední JSON a logy. Testovací úpravy nepředstavují schválení vydání.

APK: build/ui-redesign-delivery/DartScore-UI-cards-20261106-TEST.apk. SHA256: D609AD1D5D631CA4FF7E3B85D7310A6D69178536087E730563702BBBF8C43B17.

Bez commitu, push, nasazení, změny produkční instalace či iOS ATT.

Regresní herní průchody: 10/10 PASS, flows.log. Automatická viditelnost šestého hráče, návrat/pokračování, zvuk/hlas/vibrace, nához 60, týmy, editace jména a přesun ikonou. Finální S23 průchod byl zopakován po opravě řádkování členů týmu.
