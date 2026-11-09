# DartScore Pro 2.07 (107) – interní test

**Podepsaný AAB je připraven lokálně. Do Google Play nebyl nahrán.**

- Soubor: DartScorePro-v107-2.07.aab (16177742 bajtů).
- applicationId: com.randis2288.dartscorepro; versionCode 107; versionName 2.07; webové APP_VERSION 2.07.
- Nové číslování dle uživatele: 107 → 2.07, 108 → 2.08, 199 → 2.99, 200 → 3.00. Interní versionCode nadále roste bez resetu.
- SHA256 AAB: DA1D2E8665838340A52C648208286144B0B21573143BC12B4E00BD0F4003D9B1.
- Upload certifikát SHA256: 169a3816713c09a26425223f7a5e75096d9686af1a3b773049f6569c6b451792; shodný s původním v106 upload klíčem.

## Obsah a ověření

Schválený redesign a HEAVY_CLICK jsou zachované. Základ Androidu sjednocen s v106 (oprava UMP startu, návratu z reklam, přímé nativní směrování událostí, bezpečné okraje, Liftoff a aktualizované build nástroje). Zachováno portrétní chování telefonů. Podrobný integrační přehled: ../dartscore-ui-redesign/docs/internal-aab-preparation-20261106.md.

- Finálních 45/45 unit testů PASS, web build PASS.
- Podepsané assembleRelease + bundleRelease s R8 PASS.
- Google bundletool validate PASS; jarsigner: jar verified.
- V AAB ověřeny package/verze/SDK 36 a přesná shoda vloženého offline HTML, JS a CSS s aktuálním dist. Mapování R8 je součástí AAB.
- Základ prošel prvním UMP odmítnutím, Classic 3×20: 501 → 441 / Last throw 60, návratem do lobby a pěti studenými starty na izolovaném Androidu 16 bez pádu aplikace.
- Finální APK 107/2.07 úspěšně aktualizovalo podepsaný test 106/1.1.72 bez odinstalace. Načtena MainWebViewActivity; Continue game obnovilo původní skóre 441 a poslední hod 60. Viz upgrade-verification.json a snímky v build/internal-aab-20261106/emulator.
- Při startu QA emulátoru se jednou objevilo ANR systémového rozhraní Androidu; po vyčkání se prostředí zotavilo a finální aktualizace i pokračování hry prošly. Nešlo o zjištěný pád DartScore procesu.

## Rozsah a omezení

Produkcí 106 / 1.1.72 a novým označením 107 / 2.07 nás vedl uživatel. Nezávislá kontrola všech Play draftů nebyla možná, protože systém nedokázal bezpečně ověřit URL prohlížeče; 107 nebylo během této práce rezervováno ani uploadováno.

Finální sjednocené R8 sestavení je ověřené na izolovaném emulátoru Android 16. S23 byla odpojena, finální release nebyl nově fyzicky testován na S23/S10. Předchozí schválení UI a pocitu vibrací na S23 není vydáváno za nový test změněného Android základu. Skutečné nákupy/obnovení, Play App Signing distribuce a dokončené zobrazení Liftoff jsou cílem interního Play testu. Nejde o schválení veřejného vydání.

Nedělal se commit/push/merge na server, nasazení, Play upload, změna produkční instalace ani iOS ATT. Všechny rozpracované změny jsou lokální; source-provenance.json mapuje aktuální zdroje na tento artefakt. Soukromý podpisový klíč a hesla nebyly kopírovány do výstupní složky.
