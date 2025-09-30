# DartScore Pro (vícejazyčná) — jednoduchý start

Tento balíček je připraven tak, aby ho zvládl i úplný začátečník.

## 0) Co v balíčku je
- Jednoduchá **React** aplikace (Vite) — běží jako web / PWA.
- **6 jazyků**: cs, en, de, ru, nl, es. Automaticky se vybere podle telefonu; dá se přepnout vpravo nahoře.
- **Reklamní banner (placeholder)** dole — v této webové verzi jen ukázka. Skutečné reklamy přidáme až ve **verzi do Google Play**.
- Tlačítko **Remove ads** — zatím jen simulace. Skutečný nákup nastavíme v Play Console a App Store.

---

## 1) Jak to spustit u sebe (bez instalace programů)
1. Jdi na **https://vercel.com** → Sign up (Google stačí).
2. Vytvoř nový projekt → **Import** → nahraj složku z tohoto ZIPu.
3. Vercel sám rozpozná React a po **Deploy** dá veřejný odkaz, např. `https://dartscorepro.vercel.app`.

> TIP: Na mobilu pak dej „Přidat na plochu“ → máš to jako appku (PWA).

---

## 2) Jak dát appku na **Google Play** s reklamami a „Remove ads“ (jednorázově ~50 Kč)
Nejrychlejší cesta: zabalit web do nativu přes **Capacitor** a použít **AdMob + Play Billing**.

### A) Připrav si prostředí
- Nainstaluj **Node.js LTS** (stačí jednou).  
- Ve složce projektu spusť:
  ```bash
  npm install
  npm run build
  npm install @capacitor/core @capacitor/cli
  npx cap init "DartScore Pro" com.yourname.dartscore
  npx cap add android
  ```

### B) AdMob (reklamy)
1. V **Google AdMob** založ aplikaci „DartScore Pro“ (Android).  
2. Vytvoř **Ad unit** typu **Banner** (spodní). Zkopíruj **Ad Unit ID** (vypadá jako `ca-app-pub-XXXX/...`).  
3. Přidej plugin (v Android Studiu):
   - Do `android/` otevřít v **Android Studio**: `npx cap open android`  
   - Použij plugin např. `com.google.android.gms:play-services-ads` podle oficiálního návodu AdMob (přidá se do `build.gradle`).  
   - V `MainActivity` inicializuj MobileAds. Banner vykresli jako `AdView` s typem `SMART_BANNER` / `BANNER` ukotvený dole.  
4. Na stránce appky skryj dolní placeholder a nahraď ho nativním bannerm.

> Pozn.: V Play Store **není povoleno** klikat na vlastní reklamu, používej testovací ID, dokud nejsi live.

### C) „Remove ads“ (jednorázový nákup)
Možnosti:
- **Jednoduše**: použij **RevenueCat** (nejméně kódu, cross‑platform).  
- **Nativně**: Google Play Billing Library.

**Doporučení pro začátečníka – RevenueCat:**
1. Založ účet na **RevenueCat**, projekt „DartScore Pro“.  
2. V **Play Console** vytvoř **In‑app product** — jednorázový, např. `remove_ads`. Základní cena **50 Kč** (Play Console automaticky přepočítá na EUR/USD).  
3. Propoj Play s RevenueCat (API klíče).  
4. Do appky přidej SDK RevenueCat (Android). Po úspěšném nákupu ulož flag `ads_removed` a **nezobrazuj banner**.

### D) Build a publikace
1. `npm run build` → `npx cap copy`  
2. `npx cap open android` → **Android Studio** → `Build > Generate Signed Bundle / APK` (App Bundle AAB).  
3. **Play Console** → Vytvoř aplikaci → nahrát **AAB**, doplnit listing (ikona, screeny, popis), vyplnit **Privacy policy** (může být stránka na Vercelu).  
4. Nastav **cenotvorbu** pro `remove_ads`: základ **50 Kč** → zbytek se **přepočítá automaticky** na místní měny.

---

## 3) Co se změní pro **App Store (iOS)**
- Přidáš `npx cap add ios` a použiješ **Xcode**.  
- Reklamy: AdMob iOS SDK.  
- Nákupy: StoreKit2 nebo RevenueCat (doporučeno).  
- Ceny: vyber **price tier** v App Store Connect (Apple přepočítá podle země).

---

## 4) Kde upravit texty (překlady)
Soubory v `src/locales/` (`cs.json`, `en.json`, atd.). Cokoliv upravíš = hned v appce.

---

## 5) Poznámky k politice obchodů
- Nepřeháněj intenzitu reklam. **Banner** stačí.  
- Deaktivuj reklamy ihned po nákupu **remove_ads**.  
- Přidej jednoduché **Zásady ochrany soukromí** (odkaz v listing):
  - Nezbíráme osobní údaje, jen anonymní analytiku (pokud přidáš).

Hotovo. Když budeš chtít, dám ti i Android Studio projekt s AdMob a RevenueCat předdrátované.
