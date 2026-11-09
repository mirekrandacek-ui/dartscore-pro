# Důraznější hardwarový klik – 6. 11. 2026

Nahrazuje odmítnuté prodloužení pulzu z 12 na 20 ms. Uživatel výslovně zvolil vyzkoušet systémový silný klik. Délka běžného náhradního pulzu i webového fallbacku je vrácena na 12 ms.

S23 hlásí defaultVibrationAmplitude = 255 a podporuje HEAVY_CLICK. Samotná změna DEFAULT_AMPLITUDE na 255 by proto na tomto telefonu nezvýšila sílu dosavadního jednorázového pulzu. Android 10+ nyní pro všechna stávající místa používá VibrationEffect.createPredefined(EFFECT_HEAVY_CLICK). Průběh i trvání této hardwarové odezvy určuje telefon; nejde o tvrzení, že silný klik trvá přesně 12 ms. Android 8/9 ponechává běžný 12ms pulz, Android 7 také 12 ms. Nativní iOS nezměněn.

Oficiální popis: https://developer.android.com/reference/android/os/VibrationEffect#EFFECT_HEAVY_CLICK.

## Ověření

- 39/39 unit testů PASS; web build PASS; izolovaný Android assembleDebug PASS. Logy v build/haptic-intensity-20261106.
- 18/18 fyzických kontrol na S23 PASS: 15 zapnutých stisků/podržení vyvolalo přesně jeden skutečný HEAVY_CLICK; 3 vypnuté scénáře nevyvolaly žádný pulz. Číslice Classic/Cricket/Around, Double/Triple/Zpět, nához číslice/Zpět, tři tlačítka každé rulety, podržení ikony přesouvání, OFF–ON–OFF přepínač.
- Důkazy: physical-results.json, physical.log, device-capabilities.txt, vibrator-after.txt. Pocitovou sílu potvrdí uživatel, měření dokládá použitý efekt a respektování přepínače.
- Původní lokální data a přepínače testovací aplikace byly po kontrole obnoveny.

Na S23 je finální test v odděleném balíčku com.randis2288.dartscorepro.uireview. APK: build/ui-redesign-delivery/DartScore-UI-heavy-click-20261106-TEST.apk.

Bez změny produkční instalace, commit/push/nasazení/iOS ATT. Starší Android fallback není nově fyzicky ověřen. Příprava ani vydání AAB tímto nebyly provedeny.
