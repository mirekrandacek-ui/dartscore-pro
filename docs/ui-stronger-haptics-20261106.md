> NAHRAZENO: Uživatel odmítl prodloužení pulzu. Aktuální stav je popsán v ui-heavy-click-20261106.md; Android 10+ používá schválený HEAVY_CLICK a náhradní pulz byl vrácen na 12 ms.

# Znatelnejší vibrace – 6. 11. 2026

Lokální větev ui/readability-homepage-20261103. Společný krátký pulz Androidu prodloužen z 12 na 20 ms; systémová výchozí amplituda zůstává zachována. Stejná délka je použita i pro starší Android větev a webový navigator.vibrate fallback. Nativní iOS nebyl měněn.

Změna je ve společném DartScoreBridge.hapticTap (KEY_HAPTIC_DURATION_MS) a ve webovém fallbacku playKeyHaptic. Platí na všech stávajících místech: číslice po šipkách a po náhozech, Double/Triple/Zpět, akce obou rulet a podržení ikonky přesouvání hráčů. Nejsou přidaná nová vibrující místa. Přepínač i původní skórování a dotykové odezvy zůstaly zachované.

## Ověření

- 39/39 stávajících unit testů PASS: build/stronger-haptics-20261106/unit.log.
- Web build PASS: web.log; Android izolovaný assembleDebug PASS: android.log.
- S23 SM-S911B, com.randis2288.dartscorepro.uireview: 18/18 fyzických dotykových kontrol PASS. Patnáct zapnutých odezev vyvolalo přesně jeden skutečný Step=20ms pulz. Tři vypnuté scénáře vyvolaly nula pulzů. Pokryty Classic/Cricket/Around číslice, Double/Triple/Zpět, nához číslice/Zpět, všechna tři tlačítka obou rulet a dlouhé podržení ikony reorderu; navíc OFF–ON–OFF u číslice a OFF u podržení.
- Důkaz: build/stronger-haptics-20261106/physical-results.json, physical.log, vibrator-before.txt (původní Step=12ms) a vibrator-after.txt.
- Po ověření obnovena původní lokální data a nastavení testovací aplikace včetně stavu přepínače vibrací.

## Předání

Finální test je nainstalovaný na S23. APK: build/ui-redesign-delivery/DartScore-UI-stronger-haptics-20261106-TEST.apk. SHA256 E80D69E2612CC9519377E50E2EB5E91BF7BCB5F85AFF039583BBDC80566328CE.

Pocitovou sílu ještě posoudí uživatel na telefonu; měření potvrzuje délku a funkční přepínač, nikoli subjektivní dojem. Starší Android fallback nebyl fyzicky měřen a S10 není připojená. Produkční instalace, iOS ATT, push, nasazení a vydání nebyly měněny. Tato úprava sama neznamená vydání AAB.
