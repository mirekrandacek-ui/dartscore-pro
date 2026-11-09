# Týmové statistiky – UI TEST

6. 11. 2026, Randy, lokální ui/readability-homepage-20261103. Bez merge, push, uploadu do Play a změny produkční aplikace. Původní AAB 107 nebyl přestavěn.

## Výsledek

- Statistiky přepínají Hráči / Týmy. Tým je určen seřazeným složením jmen, nezávisle na pozici A/B/C nebo pořadí hráčů. Nová sestava či přejmenování představuje jiný tým.
- Nové dokončené Classic týmové zápasy automaticky ukládají playerMode, složení a stabilní identifikátory týmů, vítězný tým a týmové detailní metriky z návštěv sdíleného týmového skóre. Poslední vítězná návštěva a finální set jsou zahrnuté. Disketa se k zápisu statistik nepoužívá.
- Individuální statistiky vylučují týmové zápasy. Starší Classic záznamy lze rozpoznat jako týmové i podle remainingByPlayer se jmény týmových skóre namísto jednotlivých hráčů; složení se z toho neodhaduje.
- Starší týmové záznamy bez uloženého složení zůstávají beze změny v úložišti a exportu, nejsou zahrnuté do vypočítaných týmových ani individuálních výsledků; panel zobrazuje upozornění a jejich počet. Data se při přepínání nemigrují ani nepřepisují.
- Přehled, H2H, historie a správa fungují i pro týmy. Mazání přes týmovou projekci odkazuje na původní zápas. Skryté týmy mají oddělené úložiště od skrytých hráčů. Texty nových ovladačů jsou v sedmi podporovaných jazycích.

## Ověření

- npm test: 50/50 PASS. Nový test ověřuje identitu stejné sestavy při výměně A/B/C, oddělení individuálních zápasů, vyloučení starého týmu bez složení, přiřazení vítěze i metrik pro nesouvislé sloty A/C a mazání/vrácení originálního týmového záznamu.
- npm run build a assembleDebug s build/ui-test.init.gradle: PASS.
- qa/team-statistics.mjs nad finálním dist přes vite preview: Chromium/WebKit × 320/393 px, 4/4 PASS. Skutečně dokončen Classic 101 týmový zápas přes součtovou klávesnici, bez diskety. Po reloadu ověřeny dvě sestavy, vítěz, 101 bodů, vyhraný leg/set, individuální počet pouze jednoho původního sólo zápasu, týmová úspěšnost 100 %, H2H a nepřetékání karty. První test původně kontroloval výhru před výběrem vítězné sestavy; opraven na výslovný výběr vítěze, nikoli změnou produktu.
- Regrese 260 individuálních záznamů přes qa/statistics-transfer.mjs: 4/4 PASS po prvním přenosu týmové podpory. Následné změny tvořily týmové popisky a explicitní označení neklasických zápasů jako individuálních; finální týmový scénář byl zopakován.
- Aktuální JS/CSS v APK přesně shodné SHA256 s dist/assets. aapt potvrdil package i název, apksigner verify PASS se stejným Android Debug certifikátem jako předchozí UI TEST.

## APK a S23

- build/ui-redesign-delivery/DartScore-UI-team-statistics-20261106-TEST.apk
- 21 782 885 bajtů, SHA256 E9B8F4AC30EE54B31A9E84FC19E2B925CFEDB609A067AA5C702BA5057CDFC3C1.
- com.randis2288.dartscorepro.uireview, DartScore UI TEST, 107 / 2.07. Číslování ponecháno pro lokální test; obsah je novější než původní AAB stejné verze.
- Připojená SM-S911B / RFCW805VSVD: adb install -r Success, bez odinstalace a mazání dat. Aktualizace potvrzena na telefonu v 16:19:16 místního času, aplikace spuštěna přes ConsentLauncherActivity.
- Nový týmový zápas na fyzické S23 se automaticky nehrál, aby nebyla měněna uživatelova historie testovací aplikace. Fyzický průchod je ponechán uživateli. Play Billing, reklamy a nativní export nebyly nově ověřovány.
