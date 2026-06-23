import React, { useEffect, useMemo, useRef, useState } from 'react';
import './app.css';

/* ===== Ikona reproduktoru ===== */
const IconSpeaker = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 4V5L7 9H3zM16.5 12a3.5 3.5 0 0 0-2.13-3.22v6.44A3.5 3.5 0 0 0 16.5 12z" />
    <path d="M14.37 5.29a7 7 0 0 1 0 13.42v-2.02a5 5 0 0 0 0-9.38V5.29z" />
  </svg>
);

/* ===== Texty ===== */
const T = {
  cs: {
    app: 'DartScore Pro', sound: 'Zvuk', voice: 'Hlas', back: 'Zpět',
    mode: 'Režim', classic: 'Klasická hra', cricket: 'Cricket', around: 'Around the Clock', roulette: 'Ruleta', rouletteDouble: 'Ruleta Double',
    start: 'Start', closing: 'Ukončení',
    doubleOut: 'Double-out', tripleOut: 'Triple-out', masterOut: 'Master-out',
    anyOutHint: '— pokud není vybráno nic, uzavírá se libovolně',
    order: 'Pořadí', fixed: 'Fixní', random: 'Náhodné', playThrough: 'Dohrávat kolo',
    robot: 'Robot', off: 'Vypn.', easy: 'Snadná', medium: 'Střední', hard: 'Těžká',
    startGame: '▶ Start hry', continueGame: 'Pokračovat ve hře', saveGame: 'Uložit hru', restart: 'Opakovat hru',
    rules: 'Pravidla', addPlayer: 'Přidat hráče',
    saved: 'Uložené hry', share: 'Sdílet', clear: 'Smazat vše',
    player: 'Hráč', game: 'Hra', darts: 'šipek', avg: 'průměr/šipka', last: 'Poslední hod',
    undo: 'Zpět', next: 'Další hráč', bust: 'bez skóre', checkout: 'checkout',
    youWinPrefix: 'Výhra', outLabel: 'Ukončení', zeroWord: 'nula',
    points: 'Body', target: 'Cíl',
    playerModeLabel: 'Režim hráčů',
    individualPlayers: 'Jednotlivci',
    teamPlayers: 'Týmy',
    teamLabel: 'Tým',
    teamA: 'Tým A',
    teamB: 'Tým B',
    teamC: 'Tým C',
    teamNeedPlayers: 'Alespoň dva týmy musí mít hráče.',
    rouletteTotalPoints: 'Body celkem',
    scoreInputType: 'Typ počítání',
      scoreInput: 'Zadávání',
      scoreByDarts: 'Po šipkách',
      roundTotal: 'Součet kola',
      submitScore: 'Zapsat',
      roundTotalHint: 'Zadej součet za celé kolo po 3 šipkách.',
      confirmCheckoutRound: 'Bylo kolo zavřeno správným double/triple/master-out hodem?',
    rouletteDrawButton: 'Losovat',
    rouletteHitButton: 'Zásah +1',
    rouletteSwitchButton: 'Přepnout hráče',
    rateAppButton: 'Líbí se ti aplikace?',
    premiumInfoButton: 'Co obsahuje Premium',
    premiumMode: 'Premium režim',
    activatePremium: 'Aktivuj Premium',
    premiumAlreadyOwned: 'Kámo, Premium máš už koupené 🙂',
    gameSavedToast: 'Uloženo',
    filter: 'Filtr', all: 'Vše', week: 'Týden', month: 'Měsíc', year: 'Rok',
    h2h: 'Vzájemné zápasy', selectPlayer: 'Vyber hráče', wins: 'výhry',
    // Pravidla – plně lokalizovaná
    rulesClassic:
      'Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Cíl: přesně na 0. Volitelné: Double-out / Triple-out / Master-out (pokud nic, pak libovolné ukončení). Přestřelení nebo zbyde 1 (pokud je aktivní některé out pravidlo) = bez skóre.',
    rulesCricket:
      'Hraje se čísly 15–20 a 25. Single = 1 značka „/“, Double = 2 (✕), Triple = 3 (Ⓧ). Po 3 značkách je číslo zavřené. Přebytečné zásahy dávají body, jen pokud soupeř(i) nemají číslo zavřené.',
    rulesAround:
      'Cíle jdou postupně 1 → 20 → Bull (25). Počítá se pouze zásah aktuálního cíle. Double/Triple se počítají jako zásah. Vyhrává, kdo první trefí Bull.',
    rulesRoulette: 'Losuješ číslo, každý zásah cíle = 1 bod, nerozlišuje se single/double/triple. Po zásahu si losuješ další cíl, po třech šipkách hraje další hráč. Přepnout hráče můžeš kdykoliv.',
    rulesRouletteDouble: 'Stejné, ale počítá se jen zásah do double segmentu vylosovaného čísla. Bull se nelosuje.',
      premiumTitle: "DartScore Premium",
premiumDesc: "Posuň svou hru na vyšší úroveň. Získej víc přehledu, pohodlí a hraj bez omezení.",
premiumFeature1: "Bez reklam",
premiumFeature2: "Ukládání her",
premiumFeature3: "Statistiky hráčů",
premiumFeature4: "Vlastní barevný vzhled",
premiumButton: "Odemknout Premium – 69,99 Kč",
premiumNote: "Jednorázová platba. Žádné předplatné.",
  },
  en: {
    app: 'DartScore Pro', sound: 'Sound', voice: 'Voice', back: 'Back',
    mode: 'Mode', classic: 'Classic', cricket: 'Cricket', around: 'Around the Clock', roulette: 'Roulette', rouletteDouble: 'Roulette Double',
    start: 'Start', closing: 'Finish',
    doubleOut: 'Double-out', tripleOut: 'Triple-out', masterOut: 'Master-out',
    anyOutHint: '— if none is selected, any-out is allowed',
    order: 'Order', fixed: 'Fixed', random: 'Random', playThrough: 'Play the round',
    robot: 'Bot', off: 'Off', easy: 'Easy', medium: 'Medium', hard: 'Hard',
    startGame: '▶ Start Game', continueGame: 'Continue game', saveGame: 'Save game', restart: 'Restart game',
    rules: 'Rules', addPlayer: 'Add player',
    saved: 'Saved games', share: 'Share', clear: 'Clear all',
    player: 'Player', game: 'Game', darts: 'darts', avg: 'avg/dart', last: 'Last throw',
    undo: 'Undo', next: 'Next', bust: 'bust', checkout: 'checkout',
    youWinPrefix: 'Win', outLabel: 'Finish', zeroWord: 'zero',
    points: 'Points', target: 'Target',
    playerModeLabel: 'Player mode',
    individualPlayers: 'Individuals',
    teamPlayers: 'Teams',
    teamLabel: 'Team',
    teamA: 'Team A',
    teamB: 'Team B',
    teamC: 'Team C',
    teamNeedPlayers: 'At least two teams must have players.',
    rouletteTotalPoints: 'Total points',
    scoreInputType: 'Scoring type',
      scoreInput: 'Input',
      scoreByDarts: 'By darts',
      roundTotal: 'Round total',
      submitScore: 'Submit',
      roundTotalHint: 'Enter the total score for the full 3-dart round.',
      confirmCheckoutRound: 'Was the round finished with a valid double/triple/master-out throw?',
    rouletteDrawButton: 'Draw',
    rouletteHitButton: 'Hit +1',
    rouletteSwitchButton: 'Switch player',
    rateAppButton: 'Do you like the app?',
    premiumInfoButton: 'What Premium includes',
    premiumMode: 'Premium Mode',
    filter: 'Filter', all: 'All', week: 'Week', month: 'Month', year: 'Year',
    h2h: 'Head-to-Head', selectPlayer: 'Select player', wins: 'wins',
    rulesClassic:
      'Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Goal: finish exactly on 0. Optional: Double-out / Triple-out / Master-out (if none, any-out allowed). Overshoot or leaving 1 (when any out-rule is active) = bust.',
    rulesCricket:
      'Targets: 15–20 and 25. Single = 1 “/”, Double = 2 (✕), Triple = 3 (Ⓧ). After 3 marks the number is closed. Extra marks score points only if opponents still have the number open.',
    rulesAround:
      'Targets go 1 → 20 → Bull (25). Only hitting the current target counts. Doubles/Triples count as a hit. First to hit Bull wins.',
    rulesRoulette: 'You draw a number, each hit on the target = 1 point, single/double/triple are not distinguished. After a hit, draw another target; after three darts, the next player plays. You can switch players anytime.',
    rulesRouletteDouble: 'Same, but only a hit in the double segment of the drawn number counts. Bull is not drawn.',
  premiumTitle: "DartScore Premium",
premiumDesc: "Take your game to the next level. Get more control, insights and enjoy a smoother experience.",
premiumFeature1: "No ads",
premiumFeature2: "Game saving",
premiumFeature3: "Player statistics",
premiumFeature4: "Custom color theme",
premiumButton: "Unlock Premium – 2.99 €",
premiumNote: "One-time payment. No subscription.",
activatePremium: 'Activate Premium',
  premiumAlreadyOwned: 'Buddy, you already own Premium 🙂',
  gameSavedToast: 'Saved',
    },
  de: {
    app: 'DartScore Pro', sound: 'Ton', voice: 'Stimme', back: 'Zurück',
    mode: 'Modus', classic: 'Klassisch', cricket: 'Cricket', around: 'Rund um die Uhr', roulette: 'Roulette', rouletteDouble: 'Roulette Double',
    start: 'Start', closing: 'Beenden',
    doubleOut: 'Double-out', tripleOut: 'Triple-out', masterOut: 'Master-out',
    anyOutHint: '— wenn nichts gewählt ist, Any-out erlaubt',
    order: 'Reihenfolge', fixed: 'Fix', random: 'Zufällig', playThrough: 'Runde ausspielen',
    robot: 'Roboter', off: 'Aus', easy: 'Leicht', medium: 'Mittel', hard: 'Schwer',
    startGame: '▶ Spiel starten', continueGame: 'Spiel fortsetzen', saveGame: 'Spiel speichern', restart: 'Neu starten',
    rules: 'Regeln', addPlayer: 'Spieler hinzufügen',
    saved: 'Gespeicherte Spiele', share: 'Teilen', clear: 'Alles löschen',
    player: 'Spieler', game: 'Spiel', darts: 'Darts', avg: 'Schnitt/Dart', last: 'Letzter Wurf',
    undo: 'Zurück', next: 'Nächster', bust: 'bust', checkout: 'Checkout',
    youWinPrefix: 'Sieg', outLabel: 'Finish', zeroWord: 'null',
    points: 'Punkte', target: 'Ziel',
    playerModeLabel: 'Spielermodus',
    individualPlayers: 'Einzelspieler',
    teamPlayers: 'Teams',
    teamLabel: 'Team',
    teamA: 'Team A',
    teamB: 'Team B',
    teamC: 'Team C',
    teamNeedPlayers: 'Mindestens zwei Teams müssen Spieler haben.',
    rouletteTotalPoints: 'Punkte gesamt',
    scoreInputType: 'Zählweise',
      scoreInput: 'Eingabe',
      scoreByDarts: 'Pro Dart',
      roundTotal: 'Rundensumme',
      submitScore: 'Eintragen',
      roundTotalHint: 'Gib die Gesamtpunktzahl der kompletten 3-Dart-Runde ein.',
      confirmCheckoutRound: 'Wurde die Runde mit einem gültigen Double/Triple/Master-out beendet?',
    rouletteDrawButton: 'Auslosen',
    rouletteHitButton: 'Treffer +1',
    rouletteSwitchButton: 'Spieler wechseln',
    rateAppButton: 'Gefällt dir die App?',
    premiumInfoButton: 'Was enthält Premium?',
    premiumMode: 'Premium-Modus',
    activatePremium: 'Premium aktivieren',
    premiumAlreadyOwned: 'Premium gehört dir schon 🙂',
    gameSavedToast: 'Gespeichert',
    filter: 'Filter', all: 'Alle', week: 'Woche', month: 'Monat', year: 'Jahr',
    h2h: 'Direkte Duelle', selectPlayer: 'Spieler wählen', wins: 'Siege',
    rulesClassic:
      'Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Ziel: exakt 0. Optional: Double-out / Triple-out / Master-out (wenn nichts gewählt, any-out). Überschießen oder 1 übrig (bei aktivem Out-Regel) = bust.',
    rulesCricket:
      'Ziele: 15–20 und 25. Single = 1 „/“, Double = 2 (✕), Triple = 3 (Ⓧ). Nach 3 Marken ist die Zahl geschlossen. Überschüsse punkten nur, wenn Gegner die Zahl nicht geschlossen haben.',
    rulesAround:
      'Ziele nacheinander 1 → 20 → Bull (25). Gewertet wird nur das aktuelle Ziel. Doppel/Triple zählen als Treffer. Sieger trifft zuerst Bull.',
    rulesRoulette: 'Du ziehst eine Zahl, jeder Treffer auf das Ziel = 1 Punkt, Single/Double/Triple werden nicht unterschieden. Nach einem Treffer ziehst du ein neues Ziel, nach drei Darts spielt der nächste Spieler. Du kannst den Spieler jederzeit wechseln.',
    rulesRouletteDouble: 'Gleiches Prinzip, aber es zählt nur ein Treffer im Double-Segment der gezogenen Zahl. Bull wird nicht gezogen.',
      premiumTitle: "DartScore Premium",
premiumDesc: "Bringe dein Spiel auf das nächste Level. Mehr Übersicht, Komfort und ein besseres Spielerlebnis.",
premiumFeature1: "Keine Werbung",
premiumFeature2: "Spiele speichern",
premiumFeature3: "Spielerstatistiken",
premiumFeature4: "Eigenes Farbschema",
premiumButton: "Premium freischalten – 2,99 €",
premiumNote: "Einmalige Zahlung. Kein Abo.",
  },
  es: {
    app: 'DartScore Pro', sound: 'Sonido', voice: 'Voz', back: 'Atrás',
    mode: 'Modo', classic: 'Clásico', cricket: 'Cricket', around: 'Alrededor del reloj', roulette: 'Ruleta', rouletteDouble: 'Ruleta Double',
    start: 'Inicio', closing: 'Cierre',
    doubleOut: 'Double-out', tripleOut: 'Triple-out', masterOut: 'Master-out',
    anyOutHint: '— si no se selecciona nada, se permite any-out',
    order: 'Orden', fixed: 'Fijo', random: 'Aleatorio', playThrough: 'Jugar la ronda',
    robot: 'Robot', off: 'Apag.', easy: 'Fácil', medium: 'Medio', hard: 'Difícil',
    startGame: '▶ Empezar', continueGame: 'Continuar partida', saveGame: 'Guardar partida', restart: 'Reiniciar',
    rules: 'Reglas', addPlayer: 'Añadir jugador',
    saved: 'Partidas guardadas', share: 'Compartir', clear: 'Borrar todo',
    player: 'Jugador', game: 'Juego', darts: 'dardos', avg: 'prom/dardo', last: 'Último tiro',
    undo: 'Deshacer', next: 'Siguiente', bust: 'sin puntuación', checkout: 'checkout',
    youWinPrefix: 'Victoria', outLabel: 'Finish', zeroWord: 'cero',
    points: 'Puntos', target: 'Objetivo',
    playerModeLabel: 'Modo jugadores',
    individualPlayers: 'Individuales',
    teamPlayers: 'Equipos',
    teamLabel: 'Equipo',
    teamA: 'Equipo A',
    teamB: 'Equipo B',
    teamC: 'Equipo C',
    teamNeedPlayers: 'Al menos dos equipos deben tener jugadores.',
    rouletteTotalPoints: 'Puntos totales',
    scoreInputType: 'Tipo de puntuación',
      scoreInput: 'Entrada',
      scoreByDarts: 'Por dardos',
      roundTotal: 'Total ronda',
      submitScore: 'Guardar',
      roundTotalHint: 'Introduce la puntuación total de la ronda completa de 3 dardos.',
      confirmCheckoutRound: '¿La ronda se cerró con un tiro válido double/triple/master-out?',
    rouletteDrawButton: 'Sortear',
    rouletteHitButton: 'Acierto +1',
    rouletteSwitchButton: 'Cambiar jugador',
    rateAppButton: '¿Te gusta la app?',
    premiumInfoButton: 'Qué incluye Premium',
    premiumMode: 'Modo Premium',
    activatePremium: 'Activar Premium',
    premiumAlreadyOwned: 'Premium ya es tuyo 🙂',
    gameSavedToast: 'Guardado',
    filter: 'Filtro', all: 'Todo', week: 'Semana', month: 'Mes', year: 'Año',
    h2h: 'Cara a cara', selectPlayer: 'Elige jugador', wins: 'victorias',
    rulesClassic:
      'Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Objetivo: llegar a 0 exacto. Opcional: Double-out / Triple-out / Master-out (si no hay, any-out). Pasarse o quedar en 1 (con reglas activas) = sin puntuación.',
    rulesCricket:
      'Objetivos 15–20 y 25. Single = 1 “/”, Double = 2 (✕), Triple = 3 (Ⓧ). Con 3 marcas el número se cierra. Excesos puntúan solo si los rivales no lo tienen cerrado.',
    rulesAround:
      'Secuencia 1 → 20 → Bull (25). Solo cuenta el objetivo actual. Dobles/Triples cuentan como acierto. Gana quien golpea Bull antes.',
    rulesRoulette: 'Sorteas un número, cada acierto en el objetivo = 1 punto, no se distingue entre single/double/triple. Después de acertar, sorteas otro objetivo; después de tres dardos juega el siguiente jugador. Puedes cambiar de jugador cuando quieras.',
    rulesRouletteDouble: 'Igual, pero solo cuenta acertar el segmento double del número sorteado. Bull no se sortea.',
      premiumTitle: "DartScore Premium",
premiumDesc: "Lleva tu juego al siguiente nivel. Consigue más control, estadísticas y una mejor experiencia.",
premiumFeature1: "Sin anuncios",
premiumFeature2: "Guardar partidas",
premiumFeature3: "Estadísticas de jugadores",
premiumFeature4: "Tema de color personalizado",
premiumButton: "Desbloquear Premium – 2,99 €",
premiumNote: "Pago único. Sin suscripción.",
  },
  nl: {
    app: 'DartScore Pro', sound: 'Geluid', voice: 'Spraak', back: 'Terug',
    mode: 'Modus', classic: 'Klassiek', cricket: 'Cricket', around: 'Rond de klok', roulette: 'Roulette', rouletteDouble: 'Roulette Double',
    start: 'Start', closing: 'Einde',
    doubleOut: 'Double-out', tripleOut: 'Triple-out', masterOut: 'Master-out',
    anyOutHint: '— als niets is gekozen, any-out toegestaan',
    order: 'Volgorde', fixed: 'Vast', random: 'Willekeurig', playThrough: 'Ronde uitspelen',
    robot: 'Robot', off: 'Uit', easy: 'Makkelijk', medium: 'Gemiddeld', hard: 'Moeilijk',
    startGame: '▶ Start spel', continueGame: 'Doorgaan', saveGame: 'Spel opslaan', restart: 'Opnieuw',
    rules: 'Regels', addPlayer: 'Speler toevoegen',
    saved: 'Opgeslagen spellen', share: 'Delen', clear: 'Alles wissen',
    player: 'Speler', game: 'Spel', darts: 'darts', avg: 'gem/dart', last: 'Laatste worp',
    undo: 'Ongedaan', next: 'Volgende', bust: 'bust', checkout: 'checkout',
    youWinPrefix: 'Winst', outLabel: 'Finish', zeroWord: 'nul',
    points: 'Punten', target: 'Doel',
    playerModeLabel: 'Spelermodus',
    individualPlayers: 'Individueel',
    teamPlayers: 'Teams',
    teamLabel: 'Team',
    teamA: 'Team A',
    teamB: 'Team B',
    teamC: 'Team C',
    teamNeedPlayers: 'Minstens twee teams moeten spelers hebben.',
    rouletteTotalPoints: 'Totaal punten',
    scoreInputType: 'Scoretype',
      scoreInput: 'Invoer',
      scoreByDarts: 'Per dart',
      roundTotal: 'Rondetotaal',
      submitScore: 'Opslaan',
      roundTotalHint: 'Voer de totale score van de volledige 3-dart ronde in.',
      confirmCheckoutRound: 'Is de ronde beëindigd met een geldige double/triple/master-out worp?',
    rouletteDrawButton: 'Loten',
    rouletteHitButton: 'Raak +1',
    rouletteSwitchButton: 'Speler wisselen',
    rateAppButton: 'Vind je de app leuk?',
    premiumInfoButton: 'Wat bevat Premium?',
    premiumMode: 'Premium-modus',
    activatePremium: 'Premium activeren',
    premiumAlreadyOwned: 'Premium is al van jou 🙂',
    gameSavedToast: 'Opgeslagen',
    filter: 'Filter', all: 'Alles', week: 'Week', month: 'Maand', year: 'Jaar',
    h2h: 'Onderling', selectPlayer: 'Kies speler', wins: 'zeges',
    rulesClassic:
      'Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Doel: exact 0. Optioneel: Double-out / Triple-out / Master-out (geen keuze = any-out). Overschieten of 1 over (met regel actief) = bust.',
    rulesCricket:
      'Doelen 15–20 en 25. Single = 1 “/”, Double = 2 (✕), Triple = 3 (Ⓧ). Na 3 tekens is het getal gesloten. Overschotten scoren alleen als tegenstanders nog open hebben.',
    rulesAround:
      'Volgorde 1 → 20 → Bull (25). Alleen het huidige doel telt. Double/Triple telt als treffer. Wie het eerst Bull raakt, wint.',
    rulesRoulette: 'Je loot een nummer, elke hit op het doel = 1 punt, single/double/triple worden niet onderscheiden. Na een hit loot je een nieuw doel, na drie darts speelt de volgende speler. Je kunt op elk moment van speler wisselen.',
    rulesRouletteDouble: 'Hetzelfde, maar alleen een hit in het double-segment van het gelote nummer telt. Bull wordt niet geloot.',
      premiumTitle: "DartScore Premium",
premiumDesc: "Breng je spel naar een hoger niveau. Krijg meer overzicht, statistieken en speelcomfort.",
premiumFeature1: "Geen advertenties",
premiumFeature2: "Spellen opslaan",
premiumFeature3: "Spelerstatistieken",
premiumFeature4: "Eigen kleurthema",
premiumButton: "Premium ontgrendelen – €2,99",
premiumNote: "Eenmalige betaling. Geen abonnement.",
  },
  ru: {
    app: 'DartScore Pro', sound: 'Звук', voice: 'Голос', back: 'Назад',
    mode: 'Режим', classic: 'Классика', cricket: 'Крикет', around: 'По кругу', roulette: 'Рулетка', rouletteDouble: 'Рулетка Double',
    start: 'Старт', closing: 'Завершение',
    doubleOut: 'Double-out', tripleOut: 'Triple-out', masterOut: 'Master-out',
    anyOutHint: '— если ничего не выбрано, допустим любой финиш',
    order: 'Порядок', fixed: 'Фикс', random: 'Случайно', playThrough: 'Доиграть круг',
    robot: 'Робот', off: 'Выкл.', easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный',
    startGame: '▶ Начать игру', continueGame: 'Продолжить', saveGame: 'Сохранить игру', restart: 'Перезапуск',
    rules: 'Правила', addPlayer: 'Добавить игрока',
    saved: 'Сохранённые игры', share: 'Поделиться', clear: 'Удалить всё',
    player: 'Игрок', game: 'Игра', darts: 'дротиков', avg: 'ср./дротик', last: 'Последний бросок',
    undo: 'Отмена', next: 'Далее', bust: 'без очков', checkout: 'чекаут',
    youWinPrefix: 'Победа', outLabel: 'Finish', zeroWord: 'ноль',
    points: 'Очки', target: 'Цель',
    playerModeLabel: 'Режим игроков',
    individualPlayers: 'Индивидуально',
    teamPlayers: 'Команды',
    teamLabel: 'Команда',
    teamA: 'Команда A',
    teamB: 'Команда B',
    teamC: 'Команда C',
    teamNeedPlayers: 'Минимум в двух командах должны быть игроки.',
    rouletteTotalPoints: 'Всего очков',
    scoreInputType: 'Тип подсчёта',
      scoreInput: 'Ввод',
      scoreByDarts: 'По дротикам',
      roundTotal: 'Сумма раунда',
      submitScore: 'Записать',
      roundTotalHint: 'Введите сумму за полный раунд из 3 дротиков.',
      confirmCheckoutRound: 'Раунд был завершён правильным броском double/triple/master-out?',
    rouletteDrawButton: 'Случайная цель',
    rouletteHitButton: 'Попадание +1',
    rouletteSwitchButton: 'Сменить игрока',
    rateAppButton: 'Нравится приложение?',
    premiumInfoButton: 'Что включает Premium',
    premiumMode: 'Премиум-режим',
    activatePremium: 'Активировать Premium',
    premiumAlreadyOwned: 'Premium уже у тебя 🙂',
    gameSavedToast: 'Сохранено',
    filter: 'Фильтр', all: 'Все', week: 'Неделя', month: 'Месяц', year: 'Год',
    h2h: 'Личные встречи', selectPlayer: 'Выбери игрока', wins: 'побед',
    rulesClassic:
      'Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Цель: ровно 0. Опции: Double-out / Triple-out / Master-out (если не выбрано, любой финиш). Перебор или 1 при активных правилах = без очков.',
    rulesCricket:
      'Цели: 15–20 и 25. Single = 1 «/», Double = 2 (✕), Triple = 3 (Ⓧ). После 3 меток число закрыто. Излишки дают очки только если у соперников число не закрыто.',
    rulesAround:
      'Последовательно 1 → 20 → Bull (25). Засчитывается только текущая цель. Дабл/трипл засчитываются как попадание. Побеждает первый, кто попадёт в Bull.',
    rulesRoulette: 'Ты вытягиваешь число, каждое попадание в цель = 1 очко, single/double/triple не различаются. После попадания вытягивается новая цель, после трёх дротиков играет следующий игрок. Сменить игрока можно в любой момент.',
    rulesRouletteDouble: 'То же самое, но засчитывается только попадание в double-сегмент выбранного числа. Bull не выпадает.',
      premiumTitle: "DartScore Premium",
premiumDesc: "Подними свою игру на новый уровень. Больше контроля, статистики и удобства.",
premiumFeature1: "Без рекламы",
premiumFeature2: "Сохранение игр",
premiumFeature3: "Статистика игроков",
premiumFeature4: "Собственная цветовая тема",
premiumButton: "Разблокировать Premium – 2,99 €",
premiumNote: "Разовая оплата. Без подписки.",
  },
  zh: {
    app: 'DartScore Pro', sound: '声音', voice: '语音', back: '返回',
    mode: '模式', classic: '经典', cricket: 'Cricket', around: '顺时靶位', roulette: '轮盘', rouletteDouble: '轮盘 Double',
    start: '开始', closing: '收尾',
    doubleOut: 'Double-out', tripleOut: 'Triple-out', masterOut: 'Master-out',
    anyOutHint: '— 若未选择，允许任意收尾',
    order: '顺序', fixed: '固定', random: '随机', playThrough: '打完整轮',
    robot: '机器人', off: '关', easy: '简单', medium: '中等', hard: '困难',
    startGame: '▶ 开始游戏', continueGame: '继续游戏', saveGame: '保存对局', restart: '重新开始',
    rules: '规则', addPlayer: '添加玩家',
    saved: '已保存的对局', share: '分享', clear: '全部清除',
    player: '玩家', game: '对局', darts: '镖', avg: '均分/镖', last: '上轮合计',
    undo: '撤销', next: '下一位', bust: '爆掉', checkout: '收尾',
    youWinPrefix: '胜利', outLabel: '收尾', zeroWord: '零',
    points: '分数', target: '目标',
    playerModeLabel: '玩家模式',
    individualPlayers: '个人',
    teamPlayers: '团队',
    teamLabel: '团队',
    teamA: '团队 A',
    teamB: '团队 B',
    teamC: '团队 C',
    teamNeedPlayers: '至少两个团队必须有玩家。',
    rouletteTotalPoints: '总分',
    scoreInputType: '计分方式',
      scoreInput: '输入',
      scoreByDarts: '按镖输入',
      roundTotal: '回合总分',
      submitScore: '提交',
      roundTotalHint: '输入完整 3 镖回合的总分。',
      confirmCheckoutRound: '本回合是否以有效的 double/triple/master-out 投镖结束？',
    rouletteDrawButton: '抽取',
    rouletteHitButton: '命中 +1',
    rouletteSwitchButton: '切换玩家',
    rateAppButton: '喜欢这个应用吗？',
    premiumInfoButton: 'Premium 包含什么',
    premiumMode: '高级模式',
    activatePremium: '激活 Premium',
    premiumAlreadyOwned: '你已经拥有高级版 🙂',
    gameSavedToast: '已保存',
    filter: '筛选', all: '全部', week: '一周', month: '一月', year: '一年',
    h2h: '对战', selectPlayer: '选玩家', wins: '胜',
    rulesClassic:
      'Single = ×1, Double = ×2, Triple = ×3，Bull 25/50。目标：正好到 0。可选规则：Double-out / Triple-out / Master-out（未选则任意收尾）。超分或剩 1（在启用规则时）= 爆掉。',
    rulesCricket:
      '目标为 15–20 和 25。Single = 1“/”，Double = 2（✕），Triple = 3（Ⓧ）。3 记号后该数关闭。多余命中仅在对手未关闭时计分。',
    rulesAround:
      '依次 1 → 20 → Bull（25）。只计算当前目标。双倍/三倍视作命中。先中 Bull 者胜。',
    rulesRoulette: '抽取一个数字，每次命中目标 = 1 分，不区分 single/double/triple。命中后抽取下一个目标，三镖后轮到下一位玩家。你可以随时切换玩家。',
    rulesRouletteDouble: '规则相同，但只有命中抽取数字的 double 区才计分。不会抽取 Bull。',
      premiumTitle: "DartScore 高级版",
premiumDesc: "将你的游戏提升到新的水平。获得更多控制、统计数据和更好的体验。",
premiumFeature1: "无广告",
premiumFeature2: "保存游戏",
premiumFeature3: "玩家统计",
premiumFeature4: "自定义颜色主题",
premiumButton: "解锁高级版 – €2.99",
premiumNote: "一次性付款，无订阅。",
  }
};

const LANG_LABEL = {
  cs: 'Čeština',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  nl: 'Nederlands',
  ru: 'Русский',
  zh: '中文'
};

const t = (lang, key) => (T[lang] && T[lang][key]) || T.cs[key] || key;

/* ===== Utils ===== */
const deepClone = (obj) => {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
};

const uid = () => Math.random().toString(36).slice(2, 9);
const colors = ['#16a34a', '#3b82f6', '#ef4444', '#14b8a6', '#8b5cf6', '#e11d48', '#f59e0b', '#22c55e'];
const defaultNameFor = (lang, n) => ({
  cs: `Hráč ${n}`,
  en: `Player ${n}`,
  de: `Spieler ${n}`,
  es: `Jugador ${n}`,
  nl: `Speler ${n}`,
  ru: `Игрок ${n}`,
  zh: `玩家 ${n}`
}[lang] || `Player ${n}`);
const autoNameRx = [/^Hráč (\d+)$/, /^Player (\d+)$/, /^Spieler (\d+)$/, /^Jugador (\d+)$/, /^Speler (\d+)$/, /^Игрок (\d+)$/, /^玩家 (\d+)$/];

function speak(lang, text, enabled) {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;

  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(String(text));

  const langMap = {
    cs: 'cs-CZ',
    en: 'en-US',
    de: 'de-DE',
    es: 'es-ES',
    nl: 'nl-NL',
    ru: 'ru-RU',
    zh: 'zh-CN'
  };

  const targetLang = langMap[lang] || 'en-US';
  utter.lang = targetLang;

  // pokus o výběr ženského hlasu pro daný jazyk
  const pickVoice = () => {
    const voices = synth.getVoices() || [];
    if (!voices.length) return null;

    const sameLang = voices.filter(v =>
      v.lang && v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase())
    );

    // preferuj ženské hlasy podle názvu
    const female = sameLang.find(v =>
      /female|frau|woman|frau|frauensprache|žena/i.test(v.name)
    );

    return female || sameLang[0] || voices[0] || null;
  };

  const voice = pickVoice();
  if (voice) utter.voice = voice;

  synth.cancel();
  synth.speak(utter);
}

/* Cricket značky */
const markSymbol = (n) => (n <= 0 ? '' : (n === 1 ? '/' : (n === 2 ? '✕' : 'Ⓧ')));

/* ===== ErrorBoundary ===== */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, info: '' };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, info: String(err) };
  }
  componentDidCatch(err, info) {
    console.error('App crashed:', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: '#fff', background: '#111', minHeight: '100vh' }}>
          <h2>Ups, něco se pokazilo.</h2>
          <div style={{ opacity: .8, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12, marginTop: 12 }}>
            {this.state.info}
          </div>
          <button
            onClick={() => location.reload()}
            style={{ marginTop: 16 }}
          >
            Zkusit znovu načíst
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ===== Helpers ===== */
function formatHit(d) {
  if (!d) return '-';
  const base = d.v === 0 ? '0' : d.v;
  if (d.m === 2) return `D${base}`;
  if (d.m === 3) return `T${base}`;
  return `${base}`;
}
function formatAvg(a) {
  if (!a && a !== 0) return '0.0';
  return a.toFixed(1);
}

/* ===== AdMob interstitial handler ===== */
const ADMOB_INTERSTITIAL_SCHEME_URL = "dartscorepro://show-interstitial";

async function showInterstitialAd() {
  try {
    if (typeof window === 'undefined') return false;
    if (!/Android/i.test(navigator.userAgent)) return false;

    window.location.href = ADMOB_INTERSTITIAL_SCHEME_URL;
    return true;
  } catch (err) {
    console.warn("AdMob interstitial skipped:", err?.message || err);
    return false;
  }
}

/* ===== MAIN APP ===== */
function App() {
  const ADS_ENABLED = false;
  /* viewport fix */
    /* >>> DARTSCORE_UNIQUE_ANCHOR__VIEWPORT_FIX__START__C91E <<< */
  useEffect(() => {
    // iOS standalone / Android cutouts fallback
    const root = document.documentElement;
    root.style.setProperty('--sat-fallback', '28px');

    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);
  /* >>> DARTSCORE_UNIQUE_ANCHOR__VIEWPORT_FIX__END__C91E <<< */

  /* === STATE === */

  const [screen, setScreen] = useState('lobby');

  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const [lang, setLang] = useState(
    ((navigator.language || 'cs').slice(0, 2)) || 'cs'
  );
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);

  const [mode, setMode] = useState('classic');
  const [startScore, setStartScore] = useState(501);

  const [isPremium, setIsPremium] = useState(() => {
    try {
      return localStorage.getItem('premium') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const restorePremium = async () => {
      try {
        if (!window.getDigitalGoodsService) return;

        const service = await window.getDigitalGoodsService(
          'https://play.google.com/billing'
        );

        const purchases = await service.listPurchases();
        const hasPremium = purchases?.some(p => p.sku === 'premium_unlock');

        if (hasPremium) {
          setIsPremium(true);
          localStorage.setItem('premium', 'true');
          console.log('Premium restored from Play');
        }
      } catch (e) {
        console.warn('Restore premium failed', e);
      }
    };

    restorePremium();
  }, []);

  useEffect(() => {
    try {
      if (isPremium) localStorage.setItem('premium', 'true');
    } catch { }
  }, [isPremium]);

  const [themeColor, setThemeColor] = useState('default');

  const [showAd, setShowAd] = useState(false);
  useEffect(() => {
  if (!ADS_ENABLED) {
    setShowAd(false);
  }
}, []);
  const [adSecondsLeft, setAdSecondsLeft] = useState(20);
  const adTimerRef = useRef(null);

  const [outDouble, setOutDouble] = useState(true);
  const [outTriple, setOutTriple] = useState(false);
  const [outMaster, setOutMaster] = useState(false);

  const [randomOrder, setRandomOrder] = useState(false);
  const [playThrough, setPlayThrough] = useState(false);

  const [ai, setAi] = useState('off'); // off | easy | medium | hard
  const [scoreInputMode, setScoreInputMode] = useState('darts'); // darts | round
  const [playerMode, setPlayerMode] = useState('individual'); // individual | teams

  const [players, setPlayers] = useState([
    { id: uid(), name: defaultNameFor(lang, 1), color: colors[0], bot: false, team: 'A' },
    { id: uid(), name: defaultNameFor(lang, 2), color: colors[1], bot: false, team: 'B' }
  ]);

  const hitAudioRef = useRef(null);
  const winAudioRef = useRef(null);
  /* persist screen */

  const APP_VERSION = '1.1.16';
  const LOBBY_DEFAULTS_VERSION = APP_VERSION;

  /* načti lobby z localStorage */
  useEffect(() => {
    try {
      const defaultsVersion = localStorage.getItem('lobbyDefaultsVersion');

      if (defaultsVersion !== LOBBY_DEFAULTS_VERSION) {
        localStorage.removeItem('lobby');
        localStorage.setItem('lobbyDefaultsVersion', LOBBY_DEFAULTS_VERSION);
        return;
      }

      const s = JSON.parse(localStorage.getItem('lobby') || '{}');
      const nextMode = s.mode || 'classic';

      if (s.lang) setLang(s.lang);
      setMode(nextMode);
      if (s.startScore) setStartScore(s.startScore);
      if (typeof s.outDouble === 'boolean') setOutDouble(s.outDouble);
      if (typeof s.outTriple === 'boolean') setOutTriple(s.outTriple);
      if (typeof s.outMaster === 'boolean') setOutMaster(s.outMaster);
      if (typeof s.randomOrder === 'boolean') setRandomOrder(s.randomOrder);
      if (typeof s.playThrough === 'boolean') setPlayThrough(s.playThrough);
      if (s.ai) setAi(s.ai);

      if (nextMode === 'classic' && ['darts', 'round'].includes(s.scoreInputMode)) {
        setScoreInputMode(s.scoreInputMode);
      } else {
        setScoreInputMode('darts');
      }

      if (s.playerMode) setPlayerMode(s.playerMode);
      if (s.players) setPlayers(s.players.map((p, ix) => ({ ...p, team: p.team || (['A', 'B', 'C'][ix % 3]) })));
      if (s.themeColor) setThemeColor(s.themeColor);
    } catch { }
  }, []);

  /* ukládej lobby */
  useEffect(() => {
    try {
      localStorage.setItem(
        'lobby',
        JSON.stringify({
          lang, mode, startScore,
          outDouble, outTriple, outMaster,
          randomOrder, playThrough, ai,
          scoreInputMode: mode === 'classic' ? scoreInputMode : 'darts',
          playerMode, players,
          themeColor
        })
      );
    } catch { }
  }, [
    lang, mode, startScore,
    outDouble, outTriple, outMaster,
    randomOrder, playThrough, ai, scoreInputMode, playerMode, players,
    themeColor
  ]);

  /* v neklasických režimech nedovol nemožný Součet kola */
  useEffect(() => {
    if (mode !== 'classic' && scoreInputMode !== 'darts') {
      setScoreInputMode('darts');
    }
  }, [mode, scoreInputMode]);

  /* přelož auto-jména při změně jazyka */
  useEffect(() => {
    setPlayers(ps => ps.map(p => {
      for (const rx of autoNameRx) {
        const m = p.name.match(rx);
        if (m) {
          const n = parseInt(m[1], 10);
          return { ...p, name: defaultNameFor(lang, n) };
        }
      }
      return p;
    }));
  }, [lang]);

  /* robot do lobby / ven z lobby */
  useEffect(() => {
    setPlayers(ps => {
      const hasBot = ps.some(p => p.bot);
      if (ai === 'off') {
        return hasBot ? ps.filter(p => !p.bot) : ps;
      }
      if (!hasBot) {
        return [
          ...ps,
          {
            id: uid(),
            name: `🤖 ${t(lang, 'robot')} (${t(lang, ai)})`,
            color: colors[ps.length % colors.length],
            bot: true,
            level: ai
          }
        ];
      }
      return ps.map(p =>
        p.bot
          ? { ...p, name: `🤖 ${t(lang, 'robot')} (${t(lang, ai)})`, level: ai }
          : p
      );
    });
  }, [ai, lang]);

  /* Dynamická barevná hlavička / skin */
  useEffect(() => {
    const root = document.documentElement;

    // výchozí free skin (tmavý)
    let bg = '#0e0e0e';
    let panel = '#181a1f';
    let line = '#2b2f36';
    let accent = '#16a34a';

    if (isPremium) {
      if (themeColor === 'blue') {
        bg = '#0c1a36';
        panel = '#12284a';
        line = '#27406a';
        accent = '#3b82f6';
      } else if (themeColor === 'red') {
        bg = '#3b0d0d';
        panel = '#551414';
        line = '#752222';
        accent = '#ef4444';
      } else if (themeColor === 'purple') {
        bg = '#28104d';
        panel = '#3b176f';
        line = '#5b2aa3';
        accent = '#8b5cf6';
      } else if (themeColor === 'green') {
        bg = '#0e2d17';
        panel = '#154220';
        line = '#236633';
        accent = '#16a34a';
      } else if (themeColor === 'black') {
        bg = '#0e0e0e';
        panel = '#181a1f';
        line = '#2b2f36';
        accent = '#16a34a';
      }
    }

    root.style.setProperty('--bg', bg);
    root.style.setProperty('--panel', panel);
    root.style.setProperty('--line', line);
    root.style.setProperty('--accent', accent);
  }, [themeColor, isPremium]);

  const movePlayer = (i, dir) => setPlayers(ps => {
    const a = [...ps];
    const j = i + dir;
    if (j < 0 || j >= a.length) return a;
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  });

  const deletePlayer = (i) => {
    setPlayers(ps => {
      const toDelete = ps[i];
      if (toDelete?.bot) { setAi('off'); }
      return ps.filter((_, ix) => ix !== i);
    });
  };

  const addPlayer = () => setPlayers(ps => [
    ...ps,
    {
      id: uid(),
      name: defaultNameFor(lang, ps.length + 1),
      color: colors[ps.length % colors.length],
      bot: false
    }
  ]);

  /* ===== GAME STATE ===== */
  const [order, setOrder] = useState([]);
  const [scores, setScores] = useState([]);     // Classic
  const [darts, setDarts] = useState([]);       // aktuální 3 šipky
  const [currIdx, setCurrIdx] = useState(0);    // index do order[]
  const [mult, setMult] = useState(1);
  const [actions, setActions] = useState([]);   // undo stack
  const [thrown, setThrown] = useState([]);     // počet šipek
  const [lastTurn, setLastTurn] = useState([]); // součet posledního kola
  const [winner, setWinner] = useState(null);
  const [pendingWin, setPendingWin] = useState(null);

  const [cricket, setCricket] = useState(null);
  const [around, setAround] = useState(null);
  const [roulette, setRoulette] = useState(null);

  const currentPlayerIndex = order[currIdx] ?? 0;

  const TEAM_CODES = ['A', 'B', 'C'];

  const teamCodeByIndex = (idx) => TEAM_CODES[idx] || 'A';

  const isClassicTeamMode = () => mode === 'classic' && playerMode === 'teams';

  const playerTeam = (pIdx) => (
    players[pIdx]?.team || teamCodeByIndex(pIdx % TEAM_CODES.length)
  );

  const scoreIndexForPlayer = (pIdx) => {
    if (!isClassicTeamMode()) return pIdx;
    const idx = TEAM_CODES.indexOf(playerTeam(pIdx));
    return idx >= 0 ? idx : 0;
  };

  const teamNameByIndex = (idx) => {
    const code = teamCodeByIndex(idx);
    if (code === 'C') return t(lang, 'teamC');
    if (code === 'B') return t(lang, 'teamB');
    return t(lang, 'teamA');
  };

  const activeTeamCodesForPlayers = (sourcePlayers) => (
    TEAM_CODES.filter(code =>
      sourcePlayers.some((pl, ix) => (
        (pl.team || teamCodeByIndex(ix % TEAM_CODES.length)) === code
      ))
    )
  );

  const buildTeamOrder = (sourcePlayers) => {
    const activeTeams = activeTeamCodesForPlayers(sourcePlayers);
    if (activeTeams.length < 2) return null;

    const groups = activeTeams.map(code => {
      const members = sourcePlayers
        .map((pl, ix) => ({ pl, ix }))
        .filter(x => (
          (x.pl.team || teamCodeByIndex(x.ix % TEAM_CODES.length)) === code
        ))
        .map(x => x.ix);

      return {
        code,
        members: randomOrder ? shuffle(members) : members
      };
    });

    const max = Math.max(...groups.map(g => g.members.length));
    const result = [];

    for (let i = 0; i < max; i++) {
      for (const g of groups) {
        result.push(g.members[i % g.members.length]);
      }
    }

    return result;
  };

  const ROULETTE_ROUNDS = 8;

  const rouletteTargetsForMode = (rouletteMode = mode) => (
    rouletteMode === 'rouletteDouble'
      ? Array.from({ length: 20 }, (_, i) => i + 1)
      : [...Array.from({ length: 20 }, (_, i) => i + 1), 25, 50]
  );

  const makeRouletteDeck = (rouletteMode = mode) => shuffle(rouletteTargetsForMode(rouletteMode));

  const cloneRouletteState = (r) => ({
    ...(r || {}),
    decks: Array.isArray(r?.decks) ? r.decks.map(d => Array.isArray(d) ? [...d] : []) : [],
    currentTargets: Array.isArray(r?.currentTargets) ? [...r.currentTargets] : []
  });

  const makeRouletteState = (rouletteMode = mode, sourcePlayers = players) => ({
    decks: sourcePlayers.map(() => makeRouletteDeck(rouletteMode)),
    currentTargets: sourcePlayers.map(() => null),
    round: 1,
    maxRounds: ROULETTE_ROUNDS
  });

  const normalizeRouletteStateForPlayers = (r, rouletteMode = mode, sourcePlayers = players) => {
    const base = cloneRouletteState(r || makeRouletteState(rouletteMode, sourcePlayers));
    const count = sourcePlayers.length;

    while (base.decks.length < count) base.decks.push(makeRouletteDeck(rouletteMode));
    while (base.currentTargets.length < count) base.currentTargets.push(null);

    base.decks = base.decks.slice(0, count).map(d => Array.isArray(d) ? d : []);
    base.currentTargets = base.currentTargets.slice(0, count);
    base.maxRounds = ROULETTE_ROUNDS;

    return base;
  };

  const rouletteCurrentRoundForPlayer = (pIdx, thrownList = thrown) => (
    Math.min(Math.floor(((thrownList?.[pIdx] || 0) / 3)) + 1, ROULETTE_ROUNDS)
  );

  const isRoulettePlayerComplete = (pIdx, thrownList, r) => {
    const maxDarts = ROULETTE_ROUNDS * 3;
    const deckEmpty = ((r?.decks?.[pIdx] || []).length === 0);
    const noCurrentTarget = r?.currentTargets?.[pIdx] == null;
    return (thrownList?.[pIdx] || 0) >= maxDarts || (deckEmpty && noCurrentTarget);
  };

  const isRouletteGameComplete = (thrownList, r) => (
    players.every((_, ix) => isRoulettePlayerComplete(ix, thrownList, r))
  );

  const finishRouletteIfComplete = (nextScores, nextThrown, nextRoulette) => {
    if (!isRouletteGameComplete(nextThrown, nextRoulette)) return false;

    let bestIdx = 0;
    let bestScore = nextScores[0] ?? 0;

    nextScores.forEach((score, ix) => {
      if ((score ?? 0) > bestScore) {
        bestScore = score ?? 0;
        bestIdx = ix;
      }
    });

    finalizeWin(bestIdx, { silentVoice: false });
    return true;
  };

  const startGame = () => {
    const baseOrder = players.map((_, i) => i);
    const teamMode = mode === 'classic' && playerMode === 'teams';
    const teamOrder = teamMode ? buildTeamOrder(players) : null;

    if (teamMode && !teamOrder) {
      alert(t(lang, 'teamNeedPlayers'));
      return;
    }

    const ord = teamMode
      ? teamOrder
      : (randomOrder ? shuffle(baseOrder) : baseOrder);

    setOrder(ord);
    setCurrIdx(0);
    setActions([]);
    setWinner(null);
    setPendingWin(null);
    setMult(1);
    setDarts([]);

    if (mode === 'classic') {
      const scoreSlots = playerMode === 'teams' ? 3 : players.length;
      const sc = Array.from({ length: scoreSlots }, () => startScore);
      const dartsCnt = Array.from({ length: scoreSlots }, () => 0);
      const last = Array.from({ length: scoreSlots }, () => 0);
      setScores(sc);
      setThrown(dartsCnt);
      setLastTurn(last);
      setCricket(null);
      setAround(null);
    } else if (mode === 'cricket') {
      const init = players.map(() => ({
        marks: { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, bull: 0 },
        points: 0
      }));
      setCricket(init);
      setAround(null);
      setRoulette(null);
      setScores([]);
      setThrown(players.map(() => 0));
      setLastTurn(players.map(() => 0));
    } else if (mode === 'roulette' || mode === 'rouletteDouble') {
      setRoulette(makeRouletteState(mode, players));
      setCricket(null);
      setAround(null);
      setScores(players.map(() => 0));
      setThrown(players.map(() => 0));
      setLastTurn(players.map(() => 0));
    } else {
      const init = players.map(() => ({ next: 1 }));
      setAround(init);
      setCricket(null);
      setRoulette(null);
      setScores([]);
      setThrown(players.map(() => 0));
      setLastTurn(players.map(() => 0));
    }

    setShowAd(false);
    setAdSecondsLeft(20);

    setScreen('game');
  };

  const restartGame = () => startGame();

  function shuffle(a) {
    const arr = [...a];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const anyOutSelected = outDouble || outTriple || outMaster;
  const isFinishAllowed = (m) => {
    if (!anyOutSelected) return true;
    if (m === 2 && outDouble) return true;
    if (m === 3 && outTriple) return true;
    if ((m === 2 || m === 3) && outMaster) return true;
    return false;
  };
  const isBustLeavingOne = (newScore) => (anyOutSelected ? newScore === 1 : false);

  const playHitSound = () => {
    if (soundOn && hitAudioRef.current) {
      try {
        hitAudioRef.current.currentTime = 0;
        hitAudioRef.current.play();
      } catch { }
    }
  };

  const pushAction = (payload) => setActions(st => [...st, payload]);

  const isInvalidComboClassic = (v, m) => (m > 1 && (v === 0 || v === 25 || v === 50));

  /* ===== Classic commit ===== */
  const commitClassic = (value, mOverride) => {
    let v = value;
    let m = (mOverride ?? mult);

    const pIdx = currentPlayerIndex;
    const scoreIdx = scoreIndexForPlayer(pIdx);
    if (pIdx == null || scores[scoreIdx] == null) return;

    if (isInvalidComboClassic(v, m)) return;
    if (v === 25 || v === 50) { m = 1; }

    const hit = v * m;
    const prev = scores[scoreIdx];
    const roundScoreBeforeDart = darts.reduce((sum, d) => sum + (d?.score || 0), 0);
    const roundStartScore = prev + roundScoreBeforeDart;
    const tentative = prev - hit;

    const resetMult = () => setMult(1);

    const advanceTurn = () => {
      // žádný scheduleNextPlayer – ať to nepadá, přepnutí je tady vždy definované
      setTimeout(() => {
        try { nextPlayer(); } catch (e) { console.error('nextPlayer failed:', e); }
      }, 250);
    };

    // === BUST (přestřel / nebo zbyde 1 při out pravidlech) ===
    if (tentative < 0 || isBustLeavingOne(tentative)) {
      speak(lang, t(lang, 'bust'), voiceOn);
      playHitSound();

      pushAction({
        type: 'bust',
        mode: 'classic',
        pIdx,

        scoreIdx,
        prevScore: prev,
        dartsBefore: [...darts],
      });

      setScores(sc => sc.map((x, i) => (i === scoreIdx ? roundStartScore : x)));
      setDarts([]);
      setLastTurn(ls => ls.map((x, i) => (i === scoreIdx ? 0 : x)));
      resetMult();
      advanceTurn();
      return;
    }

    // === FINISH (na 0) ===
    if (tentative === 0) {
      // pokud out není povolený, je to bust
      if (!isFinishAllowed(m)) {
        speak(lang, t(lang, 'bust'), voiceOn);

        pushAction({
          type: 'bust',
          mode: 'classic',
          pIdx,

          scoreIdx,
          prevScore: prev,
          dartsBefore: [...darts],
        });

        setScores(sc => sc.map((x, i) => (i === scoreIdx ? roundStartScore : x)));
        setDarts([]);
        setLastTurn(ls => ls.map((x, i) => (i === scoreIdx ? 0 : x)));
        resetMult();
        advanceTurn();
        return;
      }

      // povolený finish
      playHitSound();
      pushAction({
        type: 'dart',
        mode: 'classic',
        pIdx,

        scoreIdx,
        prevScore: prev,
        newScore: 0,
        hit: { v, m, score: hit },
      });

      setScores(sc => sc.map((x, i) => (i === scoreIdx ? 0 : x)));

      // přidáme šipku do aktuálního kola + spočítáme total
      setDarts(prevD => {
        const nd = [...prevD, { v, m, score: hit }];
        const total = nd.reduce((s, a) => s + (a?.score || 0), 0);

        setThrown(th => th.map((x, i) => (i === scoreIdx ? x + 1 : x)));
        setLastTurn(ls => ls.map((x, i) => (i === scoreIdx ? total : x)));

        // když nedohráváš kolo => vyhra hned
        if (!playThrough) {
          // necháme nd (ať je vidět poslední trefa), win overlay si to převezme
          return nd;
        }

        // dohráváš kolo => označ pending win a pokračuj dál
        const dartsUsed = nd.length; // 1..3 (v rámci aktuálního kola)
        setPendingWin(prevBest => (
          !prevBest || dartsUsed < prevBest.dartsUsed
            ? { pIdx: scoreIdx, dartsUsed }
            : prevBest
        ));

        // otoč hráče až po krátké pauze, ale vizuálně kolo ukonči
        speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);
        advanceTurn();
        return [];
      });

      if (!playThrough) {
        // finalizeWin musí být mimo setState callback (kvůli čitelnosti),
        // ale tady je bezpečné – je to “okamžitý finish”
        finalizeWin(scoreIdx);
      }

      resetMult();
      return;
    }

    // === NORMAL HIT (nejde na 0) ===
    playHitSound();
    pushAction({
      type: 'dart',
      mode: 'classic',
      pIdx,

      scoreIdx,
      prevScore: prev,
      newScore: tentative,
      hit: { v, m, score: hit },
    });

    setScores(sc => sc.map((x, i) => (i === scoreIdx ? tentative : x)));

    setDarts(prevD => {
      const nd = [...prevD, { v, m, score: hit }];
      const total = nd.reduce((s, a) => s + (a?.score || 0), 0);

      setThrown(th => th.map((x, i) => (i === scoreIdx ? x + 1 : x)));
      setLastTurn(ls => ls.map((x, i) => (i === scoreIdx ? total : x)));

      if (nd.length >= 3) {
        speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);
        advanceTurn();
        return [];
      }

      return nd;
    });

    resetMult();
  };
  const commitClassicRound = (roundScore) => {
    const total = Number(roundScore);
    if (!Number.isInteger(total) || total < 0 || total > 180) return;

    const pIdx = currentPlayerIndex;
    const scoreIdx = scoreIndexForPlayer(pIdx);
    if (pIdx == null || scores[scoreIdx] == null) return;

    const prev = scores[scoreIdx];
    const tentative = prev - total;

    const resetMult = () => setMult(1);

    const advanceTurn = () => {
      setTimeout(() => {
        try { nextPlayer(); } catch (e) { console.error('nextPlayer failed:', e); }
      }, 250);
    };

    const doBust = () => {
      speak(lang, t(lang, 'bust'), voiceOn);
      playHitSound();

      pushAction({
        type: 'bust',
        mode: 'classic',
        pIdx,

        scoreIdx,
        prevScore: prev,
        dartsBefore: [...darts],
      });

      setDarts([]);
      setLastTurn(ls => ls.map((x, i) => (i === scoreIdx ? 0 : x)));
      resetMult();
      advanceTurn();
    };

    if (tentative < 0 || isBustLeavingOne(tentative)) {
      doBust();
      return;
    }

    if (tentative === 0) {
      let finishOk = true;

      if (anyOutSelected) {
        finishOk = window.confirm(t(lang, 'confirmCheckoutRound'));
      }

      if (!finishOk) {
        doBust();
        return;
      }

      playHitSound();

      pushAction({
        type: 'round',
        mode: 'classic',
        pIdx,

        scoreIdx,
        prevScore: prev,
        newScore: 0,
        hit: { v: total, m: 1, score: total },
        dartsBefore: [...darts],
        lastTurnBefore: lastTurn[scoreIdx] ?? 0,
        thrownDelta: 3,
      });

      setScores(sc => sc.map((x, i) => (i === scoreIdx ? 0 : x)));
      setThrown(th => th.map((x, i) => (i === scoreIdx ? x + 3 : x)));
      setLastTurn(ls => ls.map((x, i) => (i === scoreIdx ? total : x)));
      setDarts([]);

      if (playThrough) {
        setPendingWin(prevBest => (
          !prevBest || 3 < prevBest.dartsUsed
            ? { pIdx: scoreIdx, dartsUsed: 3 }
            : prevBest
        ));
        speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);
        advanceTurn();
      } else {
        finalizeWin(scoreIdx);
      }

      resetMult();
      return;
    }

    playHitSound();

    pushAction({
      type: 'round',
      mode: 'classic',
      pIdx,

      scoreIdx,
      prevScore: prev,
      newScore: tentative,
      hit: { v: total, m: 1, score: total },
      dartsBefore: [...darts],
      lastTurnBefore: lastTurn[scoreIdx] ?? 0,
      thrownDelta: 3,
    });

    setScores(sc => sc.map((x, i) => (i === scoreIdx ? tentative : x)));
    setThrown(th => th.map((x, i) => (i === scoreIdx ? x + 3 : x)));
    setLastTurn(ls => ls.map((x, i) => (i === scoreIdx ? total : x)));
    setDarts([]);

    speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);
    resetMult();
    advanceTurn();
  };

/* ===== Cricket commit ===== */
const commitCricket = (value, mOverride) => {
  let v = value;
  let m = (mOverride ?? mult);

  if (!cricket || !Array.isArray(cricket)) return;
  const pIdx = currentPlayerIndex;
  if (pIdx == null || !cricket[pIdx]) return;

  // Cricket bere jen 0, 15–20 a bull.
  // Single bull = 25 => 1 mark, double bull = 50 / D25 => 2 marky.
  if (v === 0) m = 1;
  if (v === 50) { v = 25; m = 2; }
  if (v === 25) m = Math.max(1, Math.min(2, m));
  if (![0, 15, 16, 17, 18, 19, 20, 25].includes(v)) return;

  const prevState = deepClone(cricket);
  const st = deepClone(cricket);
  const me = st[pIdx];

  // MISS (0) = jen šipka, žádné body/marky
  if (v === 0) {
    playHitSound();
    pushAction({
      type: 'dart',
      mode: 'cricket',
      pIdx,
      prev: prevState,
      delta: { v: 0, add: 0 }
    });

    setThrown(th => th.map((x, i) => (i === pIdx ? x + 1 : x)));

    setDarts(cur => {
      const nd = [...cur, { v: 0, m: 1, score: 0 }];
      if (nd.length >= 3) {
        scheduleNextPlayer(250);
        return [];
      }
      return nd;
    });

    setMult(1);
    return;
  }

  // normální zásah
  const key = (v === 25 ? 'bull' : String(v));
  const before = me.marks?.[key] ?? 0;

  const add = Math.max(1, Math.min(3, m));
  const newMarks = Math.min(3, before + add);
  const overflow = Math.max(0, before + add - 3);

  const opponentsOpen = st.some(
    (pl, ix) => ix !== pIdx && (pl.marks?.[key] ?? 0) < 3
  );

  const pointsPerMark = (v === 25 ? 25 : v);
  const gained = (overflow > 0 && opponentsOpen) ? overflow * pointsPerMark : 0;

  me.marks[key] = newMarks;
  if (gained > 0) me.points = (me.points || 0) + gained;

  setCricket(st);
  playHitSound();

  pushAction({
    type: 'dart',
    mode: 'cricket',
    pIdx,
    prev: prevState,
    delta: { v, add }
  });

  setThrown(th => th.map((x, i) => (i === pIdx ? x + 1 : x)));
  setLastTurn(ls => ls.map((x, i) => (i === pIdx ? (x + gained) : x)));

  // výhra: zavřené všechno + vede/je na stejno
  const closedAll = Object.values(me.marks || {}).every(n => n >= 3);
  const myPts = me.points || 0;
  if (closedAll) {
    const lead = st.every((pl, ix) => ix === pIdx || myPts >= (pl.points || 0));
    if (lead) {
      finalizeWin(pIdx, { silentVoice: false });
      return;
    }
  }

  // 3. šipka = přepnout hráče (pouze tady, pouze jednou)
  setDarts(cur => {
    const nd = [...cur, { v, m: add, score: gained }];
    if (nd.length >= 3) {
      scheduleNextPlayer(250);
      return [];
    }
    return nd;
  });

  setMult(1);
};

/* ===== Around commit ===== */  
    const commitAround = (value, mOverride) => {
      let v = value;
      let m = (mOverride ?? mult);
      if (v === 50) v = 25;

      const pIdx = currentPlayerIndex;
      if (!around || !Array.isArray(around)) return;
      if (pIdx == null || !around[pIdx]) return;

      const st = deepClone(around);
      const me = st[pIdx];
      const target = me.next;

      let hit = false;
      if (target <= 20) {
        if (v === target) hit = true;
      } else {
        if (v === 25) hit = true;
      }

      setThrown(th => th.map((x, i) => i === pIdx ? x + 1 : x));

      if (hit) {
        if (target < 20) {
          me.next = target + 1;
        } else if (target === 20) {
          me.next = 25;
        } else if (target === 25) {
          playHitSound();
          pushAction({ type: 'dart', mode: 'around', pIdx, prev: around, hit: true });
          setAround(st);
          setDarts(cur => {
            const nd = [...cur, { v, m, score: 0 }];
            return nd.length >= 3 ? [] : nd;
          });
          setMult(1);
          finalizeWin(pIdx, { silentVoice: true });
          return;
        }
        playHitSound();
        pushAction({ type: 'dart', mode: 'around', pIdx, prev: around, hit: true });
      } else {
        pushAction({ type: 'dart', mode: 'around', pIdx, prev: around, hit: false });
      }

      setAround(st);
      setDarts(cur => {
        const nd = [...cur, { v, m, score: hit ? 1 : 0 }];
        if (nd.length >= 3) {
          scheduleNextPlayer();
          return [];
        }
        return nd;
      });

      setMult(1);
    };

      const rouletteDrawTarget = () => {
        if (!(mode === 'roulette' || mode === 'rouletteDouble')) return;
        if (winner != null) return;

        const pIdx = currentPlayerIndex;
        if (pIdx == null) return;
        if (darts.length >= 3) return;

        const nextRoulette = normalizeRouletteStateForPlayers(roulette, mode, players);
        if (nextRoulette.currentTargets[pIdx] != null) return;

        const deck = nextRoulette.decks[pIdx] || [];
        if (deck.length === 0) return;

        const prevRoulette = cloneRouletteState(roulette);
        const prevScores = [...scores];
        const prevThrown = [...thrown];
        const prevLastTurn = [...lastTurn];
        const dartsBefore = [...darts];
        const currIdxBefore = currIdx;

        const target = deck.shift();
        nextRoulette.decks[pIdx] = deck;
        nextRoulette.currentTargets[pIdx] = target;
        nextRoulette.round = rouletteCurrentRoundForPlayer(pIdx);
        nextRoulette.maxRounds = ROULETTE_ROUNDS;

        pushAction({
          type: 'draw',
          mode,
          pIdx,
          prevScores,
          prevThrown,
          prevLastTurn,
          prevRoulette,
          dartsBefore,
          currIdxBefore
        });

        setRoulette(nextRoulette);
        setMult(1);
      };

      const rouletteMarkHit = () => {
        if (!(mode === 'roulette' || mode === 'rouletteDouble')) return;
        if (winner != null) return;

        const pIdx = currentPlayerIndex;
        if (pIdx == null) return;
        if (!Array.isArray(scores) || scores[pIdx] == null) return;

        const currentDarts = darts.length;
        if (currentDarts >= 3) return;

        const nextRoulette = normalizeRouletteStateForPlayers(roulette, mode, players);
        const target = nextRoulette.currentTargets[pIdx];
        if (target == null) return;

        const prevRoulette = cloneRouletteState(roulette);
        const prevScores = [...scores];
        const prevThrown = [...thrown];
        const prevLastTurn = [...lastTurn];
        const dartsBefore = [...darts];
        const currIdxBefore = currIdx;

        const nd = [...dartsBefore, { v: target, m: mode === 'rouletteDouble' ? 2 : 1, score: 1 }];
        const turnTotal = nd.reduce((sum, d) => sum + (d?.score || 0), 0);

        const nextScores = prevScores.map((x, i) => i === pIdx ? x + 1 : x);
        const nextThrown = prevThrown.map((x, i) => i === pIdx ? x + 1 : x);
        const nextLastTurn = prevLastTurn.map((x, i) => i === pIdx ? turnTotal : x);

        nextRoulette.currentTargets[pIdx] = null;

        nextRoulette.round = rouletteCurrentRoundForPlayer(pIdx, nextThrown);
        nextRoulette.maxRounds = ROULETTE_ROUNDS;

        pushAction({
          type: 'hit',
          mode,
          pIdx,
          prevScores,
          prevThrown,
          prevLastTurn,
          prevRoulette,
          dartsBefore,
          currIdxBefore
        });

        playHitSound();

        setScores(nextScores);
        setThrown(nextThrown);
        setLastTurn(nextLastTurn);
        setRoulette(nextRoulette);
        setDarts(nd);
        setMult(1);

        finishRouletteIfComplete(nextScores, nextThrown, nextRoulette);
      };

      const rouletteMarkMiss = () => {
        if (!(mode === 'roulette' || mode === 'rouletteDouble')) return;
        if (winner != null) return;

        const pIdx = currentPlayerIndex;
        if (pIdx == null) return;

        const currentDarts = darts.length;
        if (currentDarts >= 3) return;

        const nextRoulette = normalizeRouletteStateForPlayers(roulette, mode, players);
        const target = nextRoulette.currentTargets[pIdx];
        if (target == null) return;

        const prevRoulette = cloneRouletteState(roulette);
        const prevScores = [...scores];
        const prevThrown = [...thrown];
        const prevLastTurn = [...lastTurn];
        const dartsBefore = [...darts];
        const currIdxBefore = currIdx;

        const nd = [...dartsBefore, { v: target, m: 1, score: 0 }];
        const turnTotal = nd.reduce((sum, d) => sum + (d?.score || 0), 0);

        const nextScores = [...prevScores];
        const nextThrown = prevThrown.map((x, i) => i === pIdx ? x + 1 : x);
        const nextLastTurn = prevLastTurn.map((x, i) => i === pIdx ? turnTotal : x);

        if (nd.length >= 3) {
          nextRoulette.currentTargets[pIdx] = null;
        }

        nextRoulette.round = rouletteCurrentRoundForPlayer(pIdx, nextThrown);
        nextRoulette.maxRounds = ROULETTE_ROUNDS;

        pushAction({
          type: 'miss',
          mode,
          pIdx,
          prevScores,
          prevThrown,
          prevLastTurn,
          prevRoulette,
          dartsBefore,
          currIdxBefore
        });

        setScores(nextScores);
        setThrown(nextThrown);
        setLastTurn(nextLastTurn);
        setRoulette(nextRoulette);
        setDarts(nd.length >= 3 ? [] : nd);
        setMult(1);

        if (finishRouletteIfComplete(nextScores, nextThrown, nextRoulette)) return;

        if (nd.length >= 3) {
          scheduleNextPlayer(250);
        }
      };

      const rouletteSwitchPlayer = () => {
        if (!(mode === 'roulette' || mode === 'rouletteDouble')) return;
        if (winner != null) return;

        const pIdx = currentPlayerIndex;
        if (pIdx == null) return;

        const prevRoulette = cloneRouletteState(roulette);
        const prevScores = [...scores];
        const prevThrown = [...thrown];
        const prevLastTurn = [...lastTurn];
        const dartsBefore = [...darts];
        const currIdxBefore = currIdx;

        const usedDarts = Math.min(dartsBefore.length, 3);
        const missingDarts = Math.max(0, 3 - usedDarts);
        const turnTotal = dartsBefore.reduce((sum, d) => sum + (d?.score || 0), 0);

        const nextScores = [...prevScores];
        const nextThrown = prevThrown.map((x, i) => i === pIdx ? x + missingDarts : x);
        const nextLastTurn = prevLastTurn.map((x, i) => i === pIdx ? turnTotal : x);

        const nextRoulette = normalizeRouletteStateForPlayers(roulette, mode, players);
        nextRoulette.currentTargets[pIdx] = null;
        nextRoulette.round = rouletteCurrentRoundForPlayer(pIdx, nextThrown);
        nextRoulette.maxRounds = ROULETTE_ROUNDS;

        pushAction({
          type: 'switch',
          mode,
          pIdx,
          prevScores,
          prevThrown,
          prevLastTurn,
          prevRoulette,
          dartsBefore,
          currIdxBefore
        });

        setScores(nextScores);
        setThrown(nextThrown);
        setLastTurn(nextLastTurn);
        setRoulette(nextRoulette);
        setDarts([]);
        setMult(1);

        if (finishRouletteIfComplete(nextScores, nextThrown, nextRoulette)) return;

        scheduleNextPlayer(250);
      };

      const commitRoulette = () => {
        return;
      };

    const commitDart = (value, mOverride) => {
      if (winner != null) return;
      if (mode === 'classic') return commitClassic(value, mOverride);
      if (mode === 'cricket') return commitCricket(value, mOverride);
      return commitAround(value, mOverride);
    };

    const finalizeWin = (pIdx, opts = {}) => {
      if (!opts.silentVoice) {
        speak(lang, 'Vítěz!', voiceOn);
      }
      try {
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          winAudioRef.current.play();
        }
      } catch { }

      setWinner(pIdx);

      if (!isPremium) {
        window.setTimeout(() => {
          try {
            if (winAudioRef.current) {
              winAudioRef.current.pause();
              winAudioRef.current.currentTime = 0;
            }
          } catch { }

          showInterstitialAd();
        }, 1000);
      }

      if (isPremium) {
        try {
          const list = JSON.parse(localStorage.getItem('finishedGames') || '[]');
          const gameRecord = {
            ts: Date.now(),
            mode, startScore,
            outDouble, outTriple, outMaster,
            randomOrder, playThrough,
            players: players.map(p => p.name),
            winner: players[pIdx]?.name || ''
          };
          if (mode === 'classic' && Array.isArray(scores)) {
            gameRecord.remainingByPlayer = playerMode === 'teams'
              ? [0, 1, 2]
                  .filter(ix => players.some((_, pIx) => scoreIndexForPlayer(pIx) === ix))
                  .map(ix => ({
                    name: teamNameByIndex(ix),
                    remaining: scores[ix] ?? 0
                  }))
              : players.map((p, ix) => ({
                  name: p.name,
                  remaining: scores[ix] ?? 0
                }));
          }
          list.unshift(gameRecord);
          localStorage.setItem('finishedGames', JSON.stringify(list.slice(0, 200)));
        } catch { }
      }
    };

   /* >>> DARTSCORE_UNIQUE_ANCHOR__TURN_SWITCH_HELPERS__START__7C2A <<< */
const orderRef = useRef(order);
useEffect(() => { orderRef.current = order; }, [order]);

const modeRef = useRef(mode);
useEffect(() => { modeRef.current = mode; }, [mode]);

const playThroughRef = useRef(playThrough);
useEffect(() => { playThroughRef.current = playThrough; }, [playThrough]);

const pendingWinRef = useRef(pendingWin);
useEffect(() => { pendingWinRef.current = pendingWin; }, [pendingWin]);

const winnerRef = useRef(winner);
useEffect(() => { winnerRef.current = winner; }, [winner]);

const turnTimerRef = useRef(null);
const turnLockRef = useRef(false);

// odemkni plánování při změně hráče / návratu do lobby
useEffect(() => { turnLockRef.current = false; }, [currIdx, screen]);

const nextPlayerSafe = () => {
  if (turnLockRef.current) return;           // HARD GUARD: nedovol 2× přepnutí v jednom "tahu"
  turnLockRef.current = true;

  setCurrIdx((i) => {
    const ord = orderRef.current || [];
    const len = ord.length || 0;
    if (len < 1) return 0;

    const next = (i + 1) % len;

    // playThrough win po dokončení kola (použij refy, ne closure)
    if (
      modeRef.current === 'classic' &&
      next === 0 &&
      playThroughRef.current &&
      pendingWinRef.current &&
      winnerRef.current == null
    ) {
      finalizeWin(pendingWinRef.current.pIdx);
      setPendingWin(null);
    }

    return next;
  });

  setDarts([]);
  setMult(1);

  // odemkni až po chvíli, ať se timer/klik nepoperou
  setTimeout(() => { turnLockRef.current = false; }, 80);
};

const scheduleNextPlayer = (delay = 250) => {
  if (turnTimerRef.current) clearTimeout(turnTimerRef.current);
  turnTimerRef.current = setTimeout(() => {
    turnTimerRef.current = null;
    nextPlayerSafe();
  }, delay);
};
/* >>> DARTSCORE_UNIQUE_ANCHOR__NEXTPLAYER_ALIAS__ADD__A11C <<< */
const nextPlayer = () => nextPlayerSafe();
/* >>> DARTSCORE_UNIQUE_ANCHOR__NEXTPLAYER_ALIAS__ADD__A11C <<< */

/* >>> DARTSCORE_UNIQUE_ANCHOR__TURN_SWITCH_HELPERS__END__7C2A <<< */

const undo = () => {
  if (winner != null) return;
  setActions(st => {
    if (st.length === 0) return st;
    const last = st[st.length - 1];

    if (last.mode === 'classic') {
        if (last.type === 'round') {
          const { pIdx, scoreIdx = pIdx, prevScore, dartsBefore, lastTurnBefore, thrownDelta = 3 } = last;

          setScores(sc => sc.map((x, i) => i === scoreIdx ? prevScore : x));

          const pos = order.indexOf(pIdx);
          if (pos >= 0) setCurrIdx(pos);

          setDarts(dartsBefore || []);

          setThrown(th => th.map((x, i) =>
            i === scoreIdx ? Math.max(0, x - thrownDelta) : x
          ));

          setLastTurn(ls => ls.map((x, i) =>
            i === scoreIdx ? (lastTurnBefore ?? 0) : x
          ));
        } else if (last.type === 'dart') {
        const { pIdx, scoreIdx = pIdx, prevScore, hit } = last;
        setScores(sc => sc.map((x, i) => i === scoreIdx ? prevScore : x));
        setDarts(ds => {
          const d = [...ds];
          if (order[currIdx] !== pIdx) {
            const pos = order.indexOf(pIdx);
            if (pos >= 0) setCurrIdx(pos);
          }
          if (d.length > 0) d.pop();
          else d.push(hit);
          return d;
        });
        setThrown(th => th.map((x, i) =>
          i === scoreIdx ? Math.max(0, x - 1) : x
        ));
        setLastTurn(ls => ls.map((x, i) =>
          i === scoreIdx ? Math.max(0, x - (hit?.score || 0)) : x
        ));
      } else if (last.type === 'bust') {
        const { pIdx, scoreIdx = pIdx, prevScore } = last;
        setScores(sc => sc.map((x, i) => i === scoreIdx ? prevScore : x));
        const pos = order.indexOf(pIdx);
        if (pos >= 0) setCurrIdx(pos);
        setDarts(last.dartsBefore || []);
        setLastTurn(ls => ls.map((x, i) => i === scoreIdx ? 0 : x));
      }
    } else if (last.mode === 'cricket') {
      setCricket(last.prev);
      setThrown(th => th.map((x, i) =>
        i === last.pIdx ? Math.max(0, x - 1) : x
      ));
      setDarts(ds => {
        const d = [...ds];
        if (d.length > 0) d.pop();
        return d;
      });
    } else if (last.mode === 'around') {
      setAround(last.prev);
      setThrown(th => th.map((x, i) =>
        i === last.pIdx ? Math.max(0, x - 1) : x
      ));
      setDarts(ds => {
        const d = [...ds];
        if (d.length > 0) d.pop();
        return d;
      });
      } else if (last.mode === 'roulette' || last.mode === 'rouletteDouble') {
        setScores(last.prevScores || scores);
        setThrown(last.prevThrown || thrown);
        setLastTurn(last.prevLastTurn || lastTurn);
        setRoulette(last.prevRoulette || roulette);
        setDarts(last.dartsBefore || []);

        if (Number.isInteger(last.currIdxBefore)) {
          setCurrIdx(last.currIdxBefore);
        }
      }

    return st.slice(0, -1);
  });
  setMult(1);
};

const averages = useMemo(() => {
    if (mode !== 'classic') {
      return players.map(() => 0);
    }

    const count = playerMode === 'teams' ? 3 : players.length;
    return Array.from({ length: count }, (_, i) => {
      const thrownDarts = thrown[i] || 0;
      const done = startScore - (scores[i] ?? startScore);
      return thrownDarts > 0 ? (done / thrownDarts) : 0;
    });
  }, [players, thrown, scores, startScore, mode, playerMode]);

const cardRefs = useRef({});
useEffect(() => {
  const activeIdx = order[currIdx];
  const el = cardRefs.current[activeIdx];
  if (el && el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}, [order, currIdx, mode]);

    /* BOT TURN (AI) – beze změny logiky, necháváme, funguje */

    useEffect(() => {
      const pIdx = order[currIdx];
      const p = players[pIdx];

      if (!p || !p.bot || winner != null) return;

      const tables = {
        easy: { miss: 0.55, single: 0.40, double: 0.04, triple: 0.01 },
        medium: { miss: 0.18, single: 0.58, double: 0.16, triple: 0.08 },
        hard: { miss: 0.09, single: 0.50, double: 0.24, triple: 0.17 }
      };
      const tb = tables[p.level || 'easy'];

      let cancelled = false;
      const delays = [800, 1600, 2400];

      const rollMult = () => {
        const r = Math.random();
        if (r < tb.miss) return { m: 1, miss: true };
        if (r < tb.miss + tb.triple) return { m: 3, miss: false };
        if (r < tb.miss + tb.triple + tb.double) return { m: 2, miss: false };
        return { m: 1, miss: false };
      };

      const chooseTargetClassic = () => {
        const myScore = scores[pIdx];

        const finishAllowed = (m) => {
          if (!anyOutSelected) return true;
          if (m === 2 && outDouble) return true;
          if (m === 3 && outTriple) return true;
          if ((m === 2 || m === 3) && outMaster) return true;
          return false;
        };

        const checkouts = [
          { v: 20, m: 2, need: 40 }, { v: 10, m: 2, need: 20 },
          { v: 12, m: 2, need: 24 }, { v: 16, m: 2, need: 32 },
          { v: 8, m: 2, need: 16 }, { v: 6, m: 2, need: 12 },
          { v: 4, m: 2, need: 8 }, { v: 2, m: 2, need: 4 }
        ];
        for (const co of checkouts) {
          if (myScore === co.need && finishAllowed(co.m)) return co;
        }

        if (myScore <= 62) {
          if (finishAllowed(2) && myScore % 2 === 0) {
            const d = Math.min(20, Math.max(2, (myScore / 2) | 0));
            return { v: d, m: 2 };
          }
          const s = Math.min(20, Math.max(1, myScore - 40));
          return { v: (s || 1), m: 1 };
        }

        if ((p.level || 'easy') === 'easy') {
          if (Math.random() < tb.miss) {
            return { v: 0, m: 1 };
          }
          return { v: 20, m: 1 };
        }

        return { v: 20, m: 3 };
      };

      const chooseTargetCricket = () => {
        const me = cricket?.[pIdx];
        if (!me) return { v: 20, m: 1 };

        const orderArr = [20, 19, 18, 17, 16, 15, 25];

        for (const v of orderArr) {
          const key = v === 25 ? 'bull' : String(v);
          const marks = me.marks?.[key] ?? 0;
          if (marks < 3) {
            const { m, miss } = rollMult();
            const mAdj = (v === 25 ? 1 : m);
            if (miss) return { v: 0, m: 1 };
            return { v, m: mAdj };
          }
        }

        const opponentsOpen = (v) => {
          const key = v === 25 ? 'bull' : String(v);
          return cricket?.some(
            (pl, ix) => ix !== pIdx && (pl.marks?.[key] ?? 0) < 3
          );
        };
        for (const v of orderArr) {
          if (opponentsOpen(v)) {
            const { m, miss } = rollMult();
            const mAdj = (v === 25 ? 1 : m);
            if (miss) return { v: 0, m: 1 };
            return { v, m: mAdj };
          }
        }

        return { v: 20, m: 1 };
      };

      const chooseTargetAround = () => {
        const me = around?.[pIdx];
        const target = me?.next ?? 1;

        if (Math.random() < tb.miss) {
          return { v: 0, m: 1 };
        }
        if (target <= 20) return { v: target, m: 1 };
        return { v: 25, m: 1 };
      };

      const pickThrow = () => {
        if (mode === 'classic') return chooseTargetClassic();
        if (mode === 'cricket') return chooseTargetCricket();
        return chooseTargetAround();
      };

      const myIdx = pIdx;

      const throwOnce = (i) => {
        if (cancelled || winner != null) return;
        if (order[currIdx] !== myIdx) return;

        let { v, m } = pickThrow();

        if (mode === 'classic') {
          if ((v === 0 || v === 25 || v === 50) && m > 1) m = 1;
        } else if (mode === 'cricket') {
          if (v === 0) m = 1;
          if (v === 25) m = 1;
        }

        setTimeout(() => {
          if (cancelled || winner != null) return;
          if (order[currIdx] !== myIdx) return;
          commitDart(v, m);

          if (i < 2) {
            setTimeout(() => {
              if (order[currIdx] === myIdx && winner == null) {
                throwOnce(i + 1);
              }
            }, 200);
          }
        }, delays[i]);
      };

      throwOnce(0);

      return () => { cancelled = true; };

    }, [
      currIdx, order, players, winner, mode, scores,
      cricket, around,
      outDouble, outTriple, outMaster, anyOutSelected
    ]);

 /* reklama overlay */
useEffect(() => {
  if (!ADS_ENABLED || !showAd) return;

  if (adTimerRef.current) {
    clearInterval(adTimerRef.current);
    adTimerRef.current = null;
  }

  adTimerRef.current = setInterval(() => {
    setAdSecondsLeft((s) => {
      if (s <= 1) {
        clearInterval(adTimerRef.current);
        adTimerRef.current = null;
        setShowAd(false);
        return 0;
      }
      return s - 1;
    });
  }, 1000);

  return () => {
    if (adTimerRef.current) {
      clearInterval(adTimerRef.current);
      adTimerRef.current = null;
    }
  };
}, [showAd]);

const closeAdNow = () => {
  setShowAd(false);
};

const buyPremium = async () => {
  let response;

  if (isPremium) {
    setShowAd(false);
    showToast(t(lang, 'premiumAlreadyOwned'));
    return;
  }

  try {
    const hasWindow = typeof window !== 'undefined';
    const hasDigitalGoods =
      hasWindow && typeof window.getDigitalGoodsService === 'function';
    const hasPaymentRequest =
      hasWindow && typeof window.PaymentRequest === 'function';
    const isLocalDev =
      hasWindow &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname.includes('github.dev'));

    if (isLocalDev) {
      setIsPremium(true);
      localStorage.setItem('premium', 'true');
      setShowAd(false);
      showToast('Premium aktivováno (test)');
      return;
    }

    if (!hasDigitalGoods || !hasPaymentRequest) {
      showToast('Google Play nákup není v této verzi dostupný');
      return;
    }

    const service = await window.getDigitalGoodsService(
      'https://play.google.com/billing'
    );

    if (!service) {
      throw new Error('Billing service is unavailable');
    }

    const existingPurchases = await service.listPurchases();
    const alreadyOwnsPremium = existingPurchases?.some(
      purchase => purchase.sku === 'premium_unlock'
    );

    if (alreadyOwnsPremium) {
      setIsPremium(true);
      localStorage.setItem('premium', 'true');
      setShowAd(false);
      showToast(t(lang, 'premiumAlreadyOwned'));
      return;
    }

    const details = await service.getDetails(['premium_unlock']);
    if (!details || !details.length) {
      throw new Error('premium_unlock not found in Play Billing');
    }

    const item = details[0];
    const currency = item?.price?.currency || 'CZK';
    const value = item?.price?.value || '69.99';

    const request = new window.PaymentRequest(
      [
        {
          supportedMethods: 'https://play.google.com/billing',
          data: { sku: 'premium_unlock' },
        },
      ],
      {
        total: {
          label: 'DartScore Premium',
          amount: { currency, value },
        },
      }
    );

    response = await request.show();

    const token =
      response?.details?.purchaseToken ||
      response?.details?.token ||
      response?.purchaseToken ||
      response?.token;

    if (!token) {
      throw new Error('Missing purchase token');
    }

    if (typeof service.acknowledge === 'function') {
      await service.acknowledge(token, 'onetime');
    }

    if (typeof response.complete === 'function') {
      await response.complete('success');
    }

    setIsPremium(true);
    localStorage.setItem('premium', 'true');
    setShowAd(false);
    showToast('Premium aktivováno');
  } catch (err) {
    const msg = String(err?.message || err || '');
    const msgLower = msg.toLowerCase();

    if (
      msgLower.includes('already own') ||
      msgLower.includes('already owned') ||
      msgLower.includes('item already owned') ||
      msgLower.includes('tuto položku') ||
      msgLower.includes('položku již vlastníte') ||
      msgLower.includes('vlastn')
    ) {
      setIsPremium(true);
      localStorage.setItem('premium', 'true');      
      setShowAd(false);
      showToast(t(lang, 'premiumAlreadyOwned'));
      return;
    }

    try {
      if (response?.complete) {
        await response.complete('fail');
      }
    } catch {}

    console.error('BUY PREMIUM ERROR:', err);

    if (
      msg.includes('clientAppUnavailable') ||
      msg.includes('Billing service is unavailable')
    ) {
      showToast('Nákup teď není dostupný. Zavři a znovu otevři aplikaci a zkus to znovu.');
      return;
    }

    if (msg.includes('AbortError')) {
      showToast('Nákup byl zrušen.');
      return;
    }

    showToast(`Nákup Premium selhal: ${msg}`);
  }
};
    const makeSnapshot = () => ({
      version: 2,
      screen: 'game',
      lang, soundOn, voiceOn,
      mode, startScore,
      outDouble, outTriple, outMaster,
      randomOrder, playThrough, ai,
      scoreInputMode, playerMode,
      players, order, currIdx,
      scores, darts, mult, actions, thrown, lastTurn,
      winner, pendingWin,
      cricket, around, roulette,
      isPremium, themeColor
    });

    const normalizeSavedGame = (snap) => {
      if (!snap || typeof snap !== 'object') return null;

      const safePlayers = Array.isArray(snap.players)
        ? snap.players.filter(Boolean)
        : [];

      const rawOrder = Array.isArray(snap.order) ? snap.order : [];
      const safeOrder = rawOrder
        .filter(ix => Number.isInteger(ix) && ix >= 0 && ix < safePlayers.length);

      const fixedOrder = safeOrder.length > 0
        ? safeOrder
        : safePlayers.map((_, ix) => ix);

      const maxCurr = Math.max(0, fixedOrder.length - 1);
      const fixedCurrIdx = Number.isInteger(snap.currIdx)
        ? Math.min(Math.max(snap.currIdx, 0), maxCurr)
        : 0;

      return {
        ...snap,
        screen: 'game',
        players: safePlayers,
        order: fixedOrder,
        currIdx: fixedCurrIdx
      };
    };

    const isValidSavedGame = (snap) => {
      const s = normalizeSavedGame(snap);
      if (!s) return false;
      if (!Array.isArray(s.players) || s.players.length === 0) return false;
      if (!Array.isArray(s.order) || s.order.length === 0) return false;

      if (s.mode === 'classic') {
        return Array.isArray(s.scores) && s.scores.length > 0;
      }

      if (s.mode === 'cricket') {
        return Array.isArray(s.cricket) && s.cricket.length > 0;
      }

      if (s.mode === 'around') {
        return Array.isArray(s.around) && s.around.length > 0;
      }

      if (s.mode === 'roulette' || s.mode === 'rouletteDouble') {
        return !!s.roulette
          && Array.isArray(s.scores)
          && s.scores.length > 0
          && (
            Array.isArray(s.roulette.decks)
            || Array.isArray(s.roulette.currentTargets)
          );
      }

      return false;
    };

    const saveSnapshot = () => {
      try {
        if (screen !== 'game') return;

        const snap = normalizeSavedGame(makeSnapshot());
        if (!isValidSavedGame(snap)) return;

        localStorage.setItem('savedGame', JSON.stringify(snap));
      } catch { }
    };

    const continueSaved = () => {
      try {
        const raw = JSON.parse(localStorage.getItem('savedGame') || '{}');
        const s = normalizeSavedGame(raw);

        if (!isValidSavedGame(s)) {
          localStorage.removeItem('savedGame');
          showToast('Nic k pokračování');
          return;
        }

        setLang(s.lang || lang);
        setMode(s.mode || 'classic');
        setStartScore(s.startScore || 501);
        if (s.scoreInputMode) setScoreInputMode(s.scoreInputMode);
        if (s.playerMode) setPlayerMode(s.playerMode);
        setPlayers(s.players);
        setOrder(s.order);
        setCurrIdx(s.currIdx || 0);
        setScores(s.scores || []);
        setDarts(s.darts || []);
        setMult(s.mult || 1);
        setActions(s.actions || []);
        setThrown(s.thrown || []);
        setLastTurn(s.lastTurn || []);
        setWinner(s.winner ?? null);
        setPendingWin(s.pendingWin ?? null);
        setCricket(s.cricket ?? null);
        setAround(s.around ?? null);
        setRoulette(s.roulette ?? null);
        if (s.isPremium) setIsPremium(true);
        setThemeColor(s.themeColor || 'default');

        setShowAd(false);
        setAdSecondsLeft(20);

        setScreen('game');
      } catch (e) {
        console.error(e);
        localStorage.removeItem('savedGame');
        showToast('Obnova selhala');
      }
    };

    useEffect(() => {
      if (screen !== 'game') return;

      saveSnapshot();

      const handler = () => {
        saveSnapshot();
      };

      const visibilityHandler = () => {
        if (document.hidden) handler();
      };

      window.addEventListener('pagehide', handler);
      window.addEventListener('beforeunload', handler);
      document.addEventListener('visibilitychange', visibilityHandler);

      return () => {
        window.removeEventListener('pagehide', handler);
        window.removeEventListener('beforeunload', handler);
        document.removeEventListener('visibilitychange', visibilityHandler);
      };
    }, [
      screen,
      lang, soundOn, voiceOn,
      mode, startScore,
      outDouble, outTriple, outMaster,
      randomOrder, playThrough, ai,
      scoreInputMode, playerMode,
      players, order, currIdx,
      scores, darts, mult, actions, thrown, lastTurn,
      winner, pendingWin,
      cricket, around,
      isPremium, themeColor
    ]);

    const hasSaved = (() => {
      try {
        return isValidSavedGame(JSON.parse(localStorage.getItem('savedGame') || '{}'));
      } catch {
        return false;
      }
    })();


    // text režimu do hlavičky vedle výběru jazyka
    const rateApp = () => {
      const url = 'https://play.google.com/store/apps/details?id=com.randis2288.dartscorepro';

      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch {
        window.location.href = url;
      }
    };

    const modeLabel = (() => {
      if (mode === 'classic') return t(lang, 'classic');
      if (mode === 'cricket') return t(lang, 'cricket');
      if (mode === 'around') return t(lang, 'around');
      if (mode === 'roulette') return t(lang, 'roulette');
      if (mode === 'rouletteDouble') return t(lang, 'rouletteDouble');
      return '';
    })();

    return (
      <ErrorBoundary>
        <div
          className="container"
          data-mode={mode}
          data-premium={isPremium ? '1' : '0'}
          style={{
            paddingTop: 'max(var(--sat, 0px), var(--sat-fallback, 28px))',
            paddingBottom: 'var(--sab, 0px)',
          }}
        >
          {/* HEADER */}
          <div
            className="header"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            {/* 1. řádek: logo + Premium + zvuk/hlas */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                width: '100%'
              }}
            >
              <div
                className="left"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: 0,
                  flexWrap: 'wrap'
                }}
              >
                {screen === 'game' && (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      saveSnapshot();
                      setScreen('lobby');
                    }}
                    title={t(lang, 'back')}
                    style={{ flexShrink: 0 }}
                  >
                    ←
                  </button>
                )}

                <div
                  className="logo"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexShrink: 0,
                    minWidth: 0,
                    fontWeight: 900,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="dart"></span>
                  <span style={{ fontWeight: 900, whiteSpace: 'nowrap' }}>
                    {t(lang, 'app')}
                  </span>
                </div>

                {isPremium && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      lineHeight: 1.2,
                      background: '#0f1318',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                      padding: '4px 8px',
                      borderRadius: '999px',
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Premium
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  className={`iconBtn ${!soundOn ? 'muted' : ''}`}
                  onClick={() => setSoundOn(v => !v)}
                  aria-label={t(lang, 'sound')}
                >
                  <IconSpeaker />
                </button>

                <button
                  type="button"
                  className={`iconBtn ${!voiceOn ? 'muted' : ''}`}
                  onClick={() => setVoiceOn(v => !v)}
                  aria-label={t(lang, 'voice')}
                >
                  <span className="iconHead" aria-hidden="true"></span>
                </button>
              </div>
            </div>

            {/* 2. řádek: lobby = jazyk + hodnocení, hra = název režimu */}
            <div
              className="controls"
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 8,
                width: '100%'
              }}
            >
              {screen === 'lobby' ? (
                <select
                className="input"
                value={lang}
                onChange={e => setLang(e.target.value)}
                style={{
                  height: 44,
                  minWidth: 150,
                  flex: '0 0 auto'
                }}
              >
                {['cs', 'en', 'de', 'es', 'nl', 'ru', 'zh'].map(code => (
                  <option key={code} value={code}>{LANG_LABEL[code]}</option>
                ))}
              </select>
              ) : (
                <div
                  className="input"
                  style={{
                    minHeight: 44,
                    flex: '1 1 auto',
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px 12px',
                    fontWeight: 800,
                    textAlign: 'center',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent)'
                  }}
                >
                  {modeLabel}
                </div>
              )}

              {screen === 'lobby' && (
                <button
                  type="button"
                  className="btn"
                  onClick={rateApp}
                  style={{
                    minHeight: 44,
                    flex: '1 1 auto',
                    minWidth: 0,
                    fontSize: 12,
                    padding: '7px 10px',
                    borderColor: 'var(--accent)',
                    whiteSpace: 'normal',
                    lineHeight: 1.15,
                    textAlign: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflowWrap: 'anywhere'
                  }}
                >
                  ⭐ {t(lang, 'rateAppButton')}
                </button>
              )}
            </div>
          </div>

        {screen === 'lobby' ? (
  <>
    <Lobby
      lang={lang} t={t}
      mode={mode} setMode={setMode}
      startScore={startScore} setStartScore={setStartScore}
      outDouble={outDouble} setOutDouble={setOutDouble}
      outTriple={outTriple} setOutTriple={setOutTriple}
      outMaster={outMaster} setOutMaster={setOutMaster}
      randomOrder={randomOrder} setRandomOrder={setRandomOrder}
      playThrough={playThrough} setPlayThrough={setPlayThrough}
      ai={ai} setAi={setAi}
      scoreInputMode={scoreInputMode} setScoreInputMode={setScoreInputMode}
      playerMode={playerMode} setPlayerMode={setPlayerMode}
      players={players} setPlayers={setPlayers}
      addPlayer={addPlayer} deletePlayer={deletePlayer}
      movePlayer={movePlayer}
      startGame={startGame}
      continueSaved={continueSaved}
      showToast={showToast}
      hasSaved={hasSaved}
      buyPremium={buyPremium}
      isPremium={isPremium} setIsPremium={setIsPremium}
      themeColor={themeColor} setThemeColor={setThemeColor}
    />
    {false && (
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 'max(var(--sab, 0px), 0px)',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 50
        }}
      >
        <div
          style={{
            width: 320,
            height: 50,
            margin: '0 auto 6px',
            borderRadius: 8,
            background: '#1a1a1a',
            border: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            fontSize: 12,
            fontWeight: 700,
            pointerEvents: 'auto'
          }}
        >
         Banner reklama
        </div>
      </div>
    )}
  </>
) : (
  <Game
    lang={lang}
    t={t}
    mode={mode}
    playerMode={playerMode}
      scoreInputMode={scoreInputMode}
    isPremium={isPremium}
    outDesc={(() => {
      if (mode !== 'classic') {
        return mode === 'cricket' ? 'Cricket' : 'Around the Clock';
      }
      const arr = [];
      if (outDouble) arr.push('Double-out');
      if (outTriple) arr.push('Triple-out');
      if (outMaster) arr.push('Master-out');
      if (arr.length === 0) return 'Any-out';
      return arr.join(' + ');
    })()}
    players={players}
    order={order}
    currIdx={currIdx}
    scores={scores}
    thrown={thrown}
    lastTurn={lastTurn}
    cricket={cricket}
    around={around}
    roulette={roulette}
    averages={averages}
    darts={darts}
    mult={mult}
    setMult={setMult}
    commitDart={commitDart}
    rouletteDrawTarget={rouletteDrawTarget}
    rouletteMarkHit={rouletteMarkHit}
    rouletteMarkMiss={rouletteMarkMiss}
    rouletteSwitchPlayer={rouletteSwitchPlayer}
      commitClassicRound={commitClassicRound}
    undo={undo}
    winner={winner}
    saveGame={() => {
      try {
        const list = JSON.parse(localStorage.getItem('finishedGames') || '[]');
        list.unshift({
          ts: Date.now(),
          mode,
          startScore,
          outDouble,
          outTriple,
          outMaster,
          randomOrder,
          playThrough,
          players: players.map(p => p.name),
          winner: players[order[currIdx]]?.name || ''
        });
        localStorage.setItem('finishedGames', JSON.stringify(list.slice(0, 200)));
      } catch {}
      showToast(t(lang, 'gameSavedToast'));
    }}
    restartGame={restartGame}
    cardRefs={cardRefs}
    setScreen={(scr) => {
      if (scr === 'lobby') saveSnapshot();
      setScreen(scr);
    }}
  />
)}
          <audio ref={hitAudioRef} src="/dart-hit.mp3" preload="auto" />
          <audio ref={winAudioRef} src="/tada-fanfare-a-6313.mp3" preload="auto" />

        {/* FULLSCREEN OVERLAY PO VÝHŘE */}
        {false && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.9)',
              color: '#fff',
              zIndex: 9998,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                background: '#111',
                border: '2px solid var(--accent)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '320px',
                minHeight: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '20px',
                boxShadow: '0 20px 40px #000',
                textAlign: 'center'
              }}
            >
              Reklamní pauza – děkujeme za podporu hry
            </div>

            <div style={{ marginTop: '16px', fontSize: '14px', opacity: 0.8, fontWeight: 600 }}>
              Pokračovat za {adSecondsLeft}s
            </div>

            <button
              type="button"
              disabled={adSecondsLeft > 0}
              onClick={closeAdNow}
              style={{
                marginTop: '20px',
                minWidth: '160px',
                minHeight: '44px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '16px',
                background: adSecondsLeft > 0 ? '#444' : 'var(--accent)',
                border: '2px solid var(--line)',
                color: '#fff',
                opacity: adSecondsLeft > 0 ? 0.5 : 1,
                boxShadow: adSecondsLeft > 0 ? 'none' : '0 0 12px var(--accent)',
                cursor: adSecondsLeft > 0 ? 'default' : 'pointer'
              }}
            >
              Pokračovat
            </button>

            {!isPremium && (
              <button
                type="button"
                onClick={() => setShowPremiumInfo(true)}                 
                style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  lineHeight: 1.4,
                  maxWidth: '260px',
                  opacity: 0.9,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff',
                  padding: '10px 12px',
                  borderRadius: 10,
                  cursor: 'pointer'
                }}
              >
                Žádné pauzy a vlastní vzhled?
                <br />
                <strong>Odemkni Premium</strong>
              </button>
            )}
          </div>
        )}
        {toast && <div className="toast ok">✔️ {toast}</div>}
      </div>
    </ErrorBoundary>
  );
}
/* ===== LOBBY ===== */
function Lobby({       
    lang, t,
    mode, setMode,
    startScore, setStartScore,
    outDouble, setOutDouble,
    outTriple, setOutTriple,
    outMaster, setOutMaster,
    randomOrder, setRandomOrder,
    playThrough, setPlayThrough,
    ai, setAi,
    scoreInputMode, setScoreInputMode,
    playerMode, setPlayerMode,
    players, setPlayers,
    addPlayer, deletePlayer, movePlayer,
    startGame, continueSaved,
    showToast,
    hasSaved,
    buyPremium,
    isPremium, setIsPremium,
    themeColor, setThemeColor
  }) {
    const [showPremiumDetails, setShowPremiumDetails] = useState(false);
    return (
      <div className="lobbyWrap">

        {/* Režim */}
        <div className="lobbyCard">
          <div className="lobbyControls">
            <span>{t(lang, 'mode')}</span>
            <select
              className="input"
              value={mode}
              onChange={e => setMode(e.target.value)}
              style={{ height: 34 }}
            >
              <option value="classic">{t(lang, 'classic')}</option>
              <option value="cricket">{t(lang, 'cricket')}</option>
              <option value="around">{t(lang, 'around')}</option>
              <option value="roulette">{t(lang, 'roulette')}</option>
              <option value="rouletteDouble">{t(lang, 'rouletteDouble')}</option>
            </select>
          </div>
        </div>

        {/* StartScore jen pro Classic */}
        {mode === 'classic' && (
          <div className="lobbyCard">
            <div className="lobbyControls">
              <span>{t(lang, 'start')}</span>
              {[101, 301, 501, 701, 901].map(s => (
                <button
                  type="button"
                  key={s}
                  className={`tab ${startScore === s ? 'active' : ''}`}
                  style={{ padding: '4px 8px', lineHeight: 1.1 }}
                  onClick={() => setStartScore(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Out pravidla pro Classic */}
        {mode === 'classic' && (
          <div className="lobbyCard">
            <div className="lobbyControls">
              <span>{t(lang, 'closing')}</span>

              <label className={`tab ${outDouble ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={outDouble}
                  onChange={e => setOutDouble(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                {t(lang, 'doubleOut')}
              </label>

              <label className={`tab ${outTriple ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={outTriple}
                  onChange={e => setOutTriple(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                {t(lang, 'tripleOut')}
              </label>

              <label className={`tab ${outMaster ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={outMaster}
                  onChange={e => setOutMaster(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                {t(lang, 'masterOut')}
              </label>

              <div style={{ opacity: .8, fontSize: 12 }}>
                {t(lang, 'anyOutHint')}
              </div>
            </div>
          </div>
        )}

        {/* Pořadí & Robot */}
        <div className="lobbyCard">
          <div
            className="lobbyControls"
            style={{
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: '8px',
              columnGap: '12px',
              width: '100%'
            }}
          >

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span>{t(lang, 'order')}</span>

              <select
                className="input"
                value={randomOrder ? 'random' : 'fixed'}
                onChange={e => setRandomOrder(e.target.value === 'random')}
                style={{ height: 34 }}
              >
                <option value="fixed">{t(lang, 'fixed')}</option>
                <option value="random">{t(lang, 'random')}</option>
              </select>

              {mode === 'classic' && (
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <input
                    type="checkbox"
                    checked={playThrough}
                    onChange={e => setPlayThrough(e.target.checked)}
                  />
                  {t(lang, 'playThrough')}
                </label>
              )}
            </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                <span>{t(lang, 'robot')}</span>
                <select
                  className="input"
                  value={ai}
                  onChange={e => setAi(e.target.value)}
                  style={{ height: 34, minWidth: 104 }}
                >
                  <option value="off">{t(lang, 'off')}</option>
                  <option value="easy">{t(lang, 'easy')}</option>
                  <option value="medium">{t(lang, 'medium')}</option>
                  <option value="hard">{t(lang, 'hard')}</option>
                </select>

                
              </div>

              {mode === 'classic' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    flex: '1 0 100%'
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {t(lang, 'scoreInputType')}
                  </span>

                  <select
                    className="input"
                    value={scoreInputMode}
                    onChange={e => setScoreInputMode(e.target.value)}
                    style={{ height: 34, minWidth: 126 }}
                  >
                    <option value="darts">{t(lang, 'scoreByDarts')}</option>
                    <option value="round">{t(lang, 'roundTotal')}</option>
                  </select>
                </div>
              )}

          </div>
        </div>

        {/* Premium + vzhled */}
        <div className="lobbyCard">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: 8
            }}
          >
            <button
  type="button"
  className="btn"
  onClick={() => setShowPremiumDetails(s => !s)}
  style={{
    minWidth: 90,
    fontWeight: 800,
    borderColor: 'var(--accent)',
    boxShadow: showPremiumDetails ? '0 0 6px var(--accent)' : 'none'
  }}
>
  {t(lang, 'premiumInfoButton')}
</button>
            <button
              type="button"
              className="btn"
              onClick={buyPremium}           
              style={{
                minWidth: 90,
                fontWeight: 800,
                borderColor: 'var(--accent)',
                boxShadow: isPremium ? '0 0 6px var(--accent)' : 'none'
              }}
            >
            {t(lang, 'activatePremium')}
            </button>
                     </div>
{showPremiumDetails && (
  <div style={{
    marginTop: '8px',
    fontSize: 12,
    color: '#fff',
    opacity: 0.85,
    lineHeight: 1.4
  }}>
    <div>{t(lang, 'premiumFeature1')}</div>
    <div>{t(lang, 'premiumFeature2')}</div>
    <div>{t(lang, 'premiumFeature3')}</div>
    <div>{t(lang, 'premiumFeature4')}</div>
  </div>
)}
          {isPremium && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  fontSize: 12,
                  color: '#fff',
                  opacity: .8,
                  fontWeight: 600
                }}
              >
                Vzhled aplikace:
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                <button
                  type="button"
                  onClick={() => { setThemeColor('black'); }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: '2px solid #fff',
                    background: '#0e0e0e',
                    cursor: 'pointer',
                    boxShadow: themeColor === 'black' ? '0 0 6px #fff' : 'none'
                  }}
                  title="černá"
                />

                <button
                  type="button"
                  onClick={() => { setThemeColor('green'); }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: '2px solid #14532d',
                    background: '#16a34a',
                    cursor: 'pointer',
                    boxShadow: themeColor === 'green' ? '0 0 6px #fff' : 'none'
                  }}
                  title="zelená"
                />

                <button
                  type="button"
                  onClick={() => { setThemeColor('blue'); }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: '2px solid #1e3a8a',
                    background: '#3b82f6',
                    cursor: 'pointer',
                    boxShadow: themeColor === 'blue' ? '0 0 6px #fff' : 'none'
                  }}
                  title="modrá"
                />

                <button
                  type="button"
                  onClick={() => { setThemeColor('red'); }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: '2px solid #7f1d1d',
                    background: '#ef4444',
                    cursor: 'pointer',
                    boxShadow: themeColor === 'red' ? '0 0 6px #fff' : 'none'
                  }}
                  title="červená"
                />

                <button
                  type="button"
                  onClick={() => { setThemeColor('purple'); }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: '2px solid #4c1d95',
                    background: '#8b5cf6',
                    cursor: 'pointer',
                    boxShadow: themeColor === 'purple' ? '0 0 6px #fff' : 'none'
                  }}
                  title="fialová"
                />
              </div>
            </div>
          )}
        </div>

        {/* Start & Pokračovat */}
        <div className="lobbyCard">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn green"
              onClick={startGame}
            >
              {t(lang, 'startGame')}
            </button>

            {hasSaved && (
              <button
                type="button"
                className="btn"
                onClick={continueSaved}
              >
                {t(lang, 'continueGame')}
              </button>
            )}
          </div>
        </div>

        {/* Hráči */}
        <div className="lobbyCard">
            {mode === 'classic' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 12, opacity: .85 }}>{t(lang, 'playerModeLabel')}</span>
                <select
                  className="input"
                  value={playerMode}
                  onChange={e => setPlayerMode(e.target.value)}
                  style={{ height: 32, minWidth: 128 }}
                >
                  <option value="individual">{t(lang, 'individualPlayers')}</option>
                  <option value="teams">{t(lang, 'teamPlayers')}</option>
                </select>
              </div>
            )}

          {players.map((p, i) => (
            <div key={p.id} className="playerRow">
              <div className="playerName">
                <input
                  className="input"
                  value={p.name}
                  onChange={e => setPlayers(ps => ps.map((x, ix) => ix === i ? { ...x, name: e.target.value } : x))}
                  onFocus={e => e.target.select()}
                  onMouseUp={e => e.preventDefault()}
                />
              </div>

                {mode === 'classic' && playerMode === 'teams' && (
                  <div style={{ minWidth: 92 }}>
                    <select
                      className="input"
                      value={p.team || (['A', 'B', 'C'][i % 3])}
                      onChange={e => setPlayers(ps => ps.map((x, ix) => ix === i ? { ...x, team: e.target.value } : x))}
                      style={{ height: 34, width: '100%' }}
                      title={t(lang, 'teamLabel')}
                    >
                      <option value="A">{t(lang, 'teamA')}</option>
                      <option value="B">{t(lang, 'teamB')}</option>
                      <option value="C">{t(lang, 'teamC')}</option>
                    </select>
                  </div>
                )}

              <div className="playerActions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => movePlayer(i, -1)}
                  title="Up"
                  style={{ padding: '4px 8px', lineHeight: 1.1 }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => movePlayer(i, 1)}
                  title="Down"
                  style={{ padding: '4px 8px', lineHeight: 1.1 }}
                >
                  ↓
                </button>
              </div>

              <div className="playerDelete">
                <button
                  type="button"
                  className="trash"
                  onClick={() => deletePlayer(i)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn"
            onClick={addPlayer}
          >
            + {t(lang, 'addPlayer')}
          </button>
        </div>

        {/* Pravidla */}
        {/* >>> DARTSCORE_UNIQUE_ANCHOR__RULES_BLOCK__START__9F31 <<< */}
        <div className="lobbyCard">
          <details>
            <summary className="btn ghost">📖 {t(lang, 'rules')}</summary>
            <dl className="rules">
              <dt>{t(lang, 'classic')}</dt>
              <dd>{t(lang, 'rulesClassic')}</dd>

              <dt>{t(lang, 'cricket')}</dt>
              <dd>{t(lang, 'rulesCricket')}</dd>

              <dt>{t(lang, 'around')}</dt>
              <dd>{t(lang, 'rulesAround')}</dd>

              <dt>{t(lang, 'roulette')}</dt>
              <dd>{t(lang, 'rulesRoulette')}</dd>

              <dt>{t(lang, 'rouletteDouble')}</dt>
              <dd>{t(lang, 'rulesRouletteDouble')}</dd>
            </dl>
          </details>
        </div>
        {/* >>> DARTSCORE_UNIQUE_ANCHOR__RULES_BLOCK__END__9F31 <<< */}
        {isPremium && <SavedGames lang={lang} t={t} showToast={showToast} />}
      </div>
    );
  }

  /* ===== SAVED GAMES (Premium) ===== */
  function SavedGames({ lang, t, showToast }) {
    const [list, setList] = useState(() => {
      try { return JSON.parse(localStorage.getItem('finishedGames') || '[]'); }
      catch { return []; }
    });

    const [filter, setFilter] = useState('all');
    const [p1, setP1] = useState('');
    const [p2, setP2] = useState('');

    const shareItem = async (it) => {
      const text =
        `${t(lang, 'saved')}: ${new Date(it.ts).toLocaleString()} — ${it.mode} ${it.startScore || ''}
${it.players.join(', ')}
${t(lang, 'youWinPrefix')}: ${it.winner}`;
      try {
        if (navigator.share) {
          await navigator.share({ text });
        } else {
          await navigator.clipboard.writeText(text);
          try { showToast && showToast('Zkopírováno'); } catch { }
        }
      } catch { }
    };

    const clearAll = () => {
      try {
        localStorage.removeItem('finishedGames');
        setList([]);
        showToast && showToast('Vše smazáno');
      } catch { }
    };

    const now = Date.now();
    const cutoff = {
      all: 0,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
      year: now - 365 * 24 * 60 * 60 * 1000
    }[filter] || 0;

    const filtered = list.filter(g => (g.ts || 0) >= cutoff);

    const allPlayers = Array.from(new Set(list.flatMap(g => g.players || []))).sort();

    let h2h = null;
    if (p1 && p2 && p1 !== p2) {
      let p1wins = 0, p2wins = 0, games = 0;
      for (const g of filtered) {
        if ((g.players || []).includes(p1) && (g.players || []).includes(p2)) {
          games++;
          if (g.winner === p1) p1wins++;
          else if (g.winner === p2) p2wins++;
        }
      }
      h2h = { games, p1wins, p2wins };
    }

    if (list.length === 0) {
      return (
        <div className="lobbyCard">
          <strong>{t(lang, 'saved')}:</strong> —
        </div>
      );
    }

    return (
      <div className="lobbyCard">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 6
        }}>
          <strong>{t(lang, 'saved')}</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              {t(lang, 'filter')}:
              <select className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ height: 30 }}>
                <option value="all">{t(lang, 'all')}</option>
                <option value="week">{t(lang, 'week')}</option>
                <option value="month">{t(lang, 'month')}</option>
                <option value="year">{t(lang, 'year')}</option>
              </select>
            </label>

            <button
              type="button"
              className="btn"
              onClick={clearAll}
            >
              {t(lang, 'clear')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <strong>{t(lang, 'h2h')}:</strong>
          <select className="input" value={p1} onChange={e => setP1(e.target.value)} style={{ height: 30 }}>
            <option value="">{t(lang, 'selectPlayer')}</option>
            {allPlayers.map(n => <option key={`p1-${n}`} value={n}>{n}</option>)}
          </select>
          <span>vs</span>
          <select className="input" value={p2} onChange={e => setP2(e.target.value)} style={{ height: 30 }}>
            <option value="">{t(lang, 'selectPlayer')}</option>
            {allPlayers.map(n => <option key={`p2-${n}`} value={n}>{n}</option>)}
          </select>
          {h2h && (
            <span style={{ fontSize: 12, opacity: .9 }}>
              {p1}: {h2h.p1wins} {t(lang, 'wins')} • {p2}: {h2h.p2wins} {t(lang, 'wins')} • {h2h.games} {t(lang, 'game')}
            </span>
          )}
        </div>

        <div className="savedList">
          {filtered.map((it, idx) => (
            <div key={idx} className="savedRow">
              <div>
                <div className="savedTitle">
                  {new Date(it.ts).toLocaleString()}
                </div>
                <div className="savedSub">
                  {`${it.mode} ${it.startScore || ''} • ${it.players.join(', ')}`}
                </div>
                <div className="savedSub">
                  {t(lang, 'youWinPrefix')}: {it.winner}
                </div>
                {Array.isArray(it.remainingByPlayer) && it.remainingByPlayer.length > 0 && (
                  <div className="savedSub">
                    {it.remainingByPlayer.map(r => `${r.name}: ${r.remaining}`).join(' • ')}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => shareItem(it)}
              >
                {t(lang, 'share')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  /* ===== GAME SCREEN ===== */
  function Game({
    lang, t, mode, playerMode, scoreInputMode, outDesc, isPremium,
    players, order, currIdx,
    scores, averages, thrown, lastTurn,
    cricket, around, roulette,
    darts, mult, setMult, commitDart, commitClassicRound,
    rouletteDrawTarget, rouletteMarkHit, rouletteMarkMiss, rouletteSwitchPlayer,
    undo, winner,
    saveGame, restartGame, cardRefs, setScreen
  }) {
    const HEAD_H = 40;
    const PAD_H = 160;
    const [roundScoreInput, setRoundScoreInput] = React.useState('');

    const gameTeamCodes = ['A', 'B', 'C'];

    const gameTeamCodeByIndex = (idx) => gameTeamCodes[idx] || 'A';

    const gameTeamIndex = (code) => {
      const idx = gameTeamCodes.indexOf(code);
      return idx >= 0 ? idx : 0;
    };

    const gamePlayerTeam = (player, ix) => (
      player?.team || gameTeamCodeByIndex(ix % gameTeamCodes.length)
    );

    const gameActiveTeamIndexes = () => (
      gameTeamCodes
        .map((code, idx) => ({ code, idx }))
        .filter(({ code }) => players.some((pl, ix) => gamePlayerTeam(pl, ix) === code))
        .map(x => x.idx)
    );

    const submitRoundScore = () => {
      if (roundScoreInput === '') return;
      const n = Number(roundScoreInput);
      if (!Number.isInteger(n) || n < 0 || n > 180) return;
      commitClassicRound(n);
      setRoundScoreInput('');
    };

    // keypad layout
    const keypad = React.useMemo(() => {
      if (mode === 'cricket') {
        return [
          [15, 16, 17, 18, 19, 20, 25],
          [0],
        ];
      }
      if (mode === 'roulette' || mode === 'rouletteDouble') {
        return [];
      }
      if (mode === 'around') {
        return [
          [1, 2, 3, 4, 5, 6, 7],
          [8, 9, 10, 11, 12, 13, 14],
          [15, 16, 17, 18, 19, 20, 25],
          [0],
        ];
      }
      return [
        [1, 2, 3, 4, 5, 6, 7],
        [8, 9, 10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19, 20, 25],
        [0, 50],
      ];
    }, [mode]);

    const cricketTargets = ['15', '16', '17', '18', '19', '20', 'bull'];

    const hideDartControls = mode === 'roulette' || mode === 'rouletteDouble';

    const rouletteTargetLabel = (target) => {
      if (target === 25) return 'Bull 25';
      if (target === 50) return 'Bull 50';
      return target ?? '-';
    };

    const [rouletteDrawing, setRouletteDrawing] = React.useState(false);
    const [rouletteSpinTarget, setRouletteSpinTarget] = React.useState(null);
    const [rouletteAutoDrawPending, setRouletteAutoDrawPending] = React.useState(false);
    const [rouletteAutoSwitchPending, setRouletteAutoSwitchPending] = React.useState(false);

    const rouletteSpinOptions = React.useMemo(() => (
      mode === 'rouletteDouble'
        ? Array.from({ length: 20 }, (_, i) => i + 1)
        : [...Array.from({ length: 20 }, (_, i) => i + 1), 25, 50]
    ), [mode]);

    const runRouletteDraw = React.useCallback(() => {
      if (rouletteDrawing) return;

      setRouletteDrawing(true);
      setRouletteSpinTarget(rouletteSpinOptions[Math.floor(Math.random() * rouletteSpinOptions.length)]);

      const interval = window.setInterval(() => {
        setRouletteSpinTarget(rouletteSpinOptions[Math.floor(Math.random() * rouletteSpinOptions.length)]);
      }, 90);

      window.setTimeout(() => {
        window.clearInterval(interval);
        setRouletteDrawing(false);
        setRouletteSpinTarget(null);
        rouletteDrawTarget();
      }, 3000);
    }, [rouletteDrawing, rouletteSpinOptions, rouletteDrawTarget]);

    React.useEffect(() => {
      if (!(mode === 'roulette' || mode === 'rouletteDouble')) return;
      if (!rouletteAutoDrawPending) return;
      if (rouletteDrawing) return;
      if (winner != null) return;

      const pIdx = order[currIdx];
      const currentTarget = roulette?.currentTargets?.[pIdx] ?? null;
      const deckLeft = roulette?.decks?.[pIdx]?.length ?? 0;
      const remainingDarts = Math.max(0, 3 - darts.length);

      if (currentTarget != null || remainingDarts <= 0 || deckLeft <= 0) {
        setRouletteAutoDrawPending(false);
        return;
      }

      const timer = window.setTimeout(() => {
        setRouletteAutoDrawPending(false);
        runRouletteDraw();
      }, 250);

      return () => window.clearTimeout(timer);
    }, [
      mode,
      rouletteAutoDrawPending,
      rouletteDrawing,
      winner,
      order,
      currIdx,
      roulette,
      darts.length,
      runRouletteDraw
    ]);

    React.useEffect(() => {
      if (!(mode === 'roulette' || mode === 'rouletteDouble')) return;
      if (!rouletteAutoSwitchPending) return;
      if (rouletteDrawing) return;
      if (winner != null) return;

      const remainingDarts = Math.max(0, 3 - darts.length);

      if (remainingDarts > 0) {
        setRouletteAutoSwitchPending(false);
        return;
      }

      const timer = window.setTimeout(() => {
        setRouletteAutoSwitchPending(false);
        rouletteSwitchPlayer();
      }, 350);

      return () => window.clearTimeout(timer);
    }, [
      mode,
      rouletteAutoSwitchPending,
      rouletteDrawing,
      winner,
      darts.length,
      rouletteSwitchPlayer
    ]);

    const isBotPlayer = (player) => {
      const name = String(player?.name || '').toLowerCase();
      return !!(
        player?.isBot ||
        player?.bot ||
        player?.isRobot ||
        player?.type === 'bot' ||
        player?.kind === 'bot' ||
        name.includes('bot') ||
        name.includes('robot')
      );
    };

    const rouletteBotHitChance = (player, rouletteMode) => {
      const tables = {
        easy: { miss: 0.55, single: 0.40, double: 0.04, triple: 0.01 },
        medium: { miss: 0.18, single: 0.58, double: 0.16, triple: 0.08 },
        hard: { miss: 0.09, single: 0.50, double: 0.24, triple: 0.17 }
      };

      const tb = tables[player?.level || 'easy'] || tables.easy;

      if (rouletteMode === 'rouletteDouble') {
        return tb.double;
      }

      return tb.single + tb.double + tb.triple;
    };

    React.useEffect(() => {
      if (!(mode === 'roulette' || mode === 'rouletteDouble')) return;
      if (winner != null) return;

      const pIdx = order[currIdx];
      const player = players[pIdx];
      if (!isBotPlayer(player)) return;

      const currentTarget = roulette?.currentTargets?.[pIdx] ?? null;
      const deckLeft = roulette?.decks?.[pIdx]?.length ?? 0;
      const remainingDarts = Math.max(0, 3 - darts.length);

      let timer;

      if (remainingDarts <= 0) {
        timer = window.setTimeout(() => rouletteSwitchPlayer(), 650);
      } else if (currentTarget == null) {
        timer = window.setTimeout(() => {
          if (deckLeft > 0) rouletteDrawTarget();
          else rouletteSwitchPlayer();
        }, 650);
      } else {
        const chance = rouletteBotHitChance(player, mode);
        timer = window.setTimeout(() => {
          if (Math.random() < chance) rouletteMarkHit();
          else rouletteMarkMiss();
        }, 850);
      }

      return () => {
        if (timer) window.clearTimeout(timer);
      };
    }, [
      mode,
      winner,
      order,
      currIdx,
      players,
      roulette,
      darts.length,
      rouletteDrawTarget,
      rouletteMarkHit,
      rouletteMarkMiss,
      rouletteSwitchPlayer
    ]);
    const activeStyle = isPremium
      ? { outline: '2px solid #ffffff', background: 'rgba(255,255,255,0.08)' }
      : { outline: '2px solid var(--green)' };
    return (
      <div className="gameWrap">
        {/* HORNÍ LIŠTA */}
        <div className="gameTopBar">
          {mode === 'classic' && (
            <span className="badge">
              {`${t(lang, 'outLabel')}: ${outDesc}`}
            </span>
          )}

          {(mode === 'roulette' || mode === 'rouletteDouble') && (
            <span className="badge">
              {`${t(lang, 'target')}: ${rouletteTargetLabel(roulette?.currentTargets?.[order[currIdx]])} • ${Math.min(Math.floor(((thrown[order[currIdx]] || 0) / 3)) + 1, roulette?.maxRounds ?? 8)}/${roulette?.maxRounds ?? 8}`}
            </span>
          )}

          <div
            className="gameTopBtns"
            style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}
          >
            <button
              type="button"
              className="btn"
              onClick={restartGame}
              style={{ whiteSpace: 'nowrap', minWidth: 80 }}
            >
              {t(lang, 'restart') ?? 'Restart'}
            </button>

            {isPremium && (
              <button
                type="button"
                className="btn"
                onClick={saveGame}
                style={{ whiteSpace: 'nowrap', minWidth: 80 }}
              >
                {t(lang, 'saveGame') ?? 'Uložit hru'}
              </button>
            )}

            <button
              type="button"
              className="btn ghost"
              onClick={() => setScreen('lobby')}
              style={{ whiteSpace: 'nowrap', minWidth: 80 }}
            >
              {t(lang, 'back') ?? 'Zpět'}
            </button>
          </div>
        </div>

        {/* SCOREBOARD */}
          {mode === 'classic' && playerMode === 'teams' ? (
            <div className="playersPane" data-premium={isPremium ? '1' : '0'}>
              {gameActiveTeamIndexes().map(teamIdx => {
                const activePlayerIdx = order[currIdx];
                const activeTeamIdx = gameTeamIndex(gamePlayerTeam(players[activePlayerIdx], activePlayerIdx));
                const active = teamIdx === activeTeamIdx && winner == null;
                const currentDarts = active ? darts : [];
                const teamName = t(lang, teamIdx === 2 ? 'teamC' : teamIdx === 1 ? 'teamB' : 'teamA');
                const teamCode = gameTeamCodeByIndex(teamIdx);
                const members = players
                  .map((pl, ix) => ({ name: pl.name, ix, team: gamePlayerTeam(pl, ix) }))
                  .filter(m => m.team === teamCode);

                return (
                  <div
                    key={`team-${teamIdx}`}
                    ref={node => { if (node) cardRefs.current[teamIdx] = node; }}
                    className={'playerCard' + (active ? ' active' : '') + (winner === teamIdx ? ' winner' : '')}
                    style={active ? activeStyle : undefined}
                  >
                    {winner === teamIdx && (
                      <>
                        <div className="starburst" aria-hidden="true">
                          {Array.from({ length: 12 }).map((_, k) => (
                            <span key={k} style={{ '--k': k }} />
                          ))}
                        </div>
                        <div className="confetti" aria-hidden="true">
                          {Array.from({ length: 50 }).map((_, k) => (
                            <span key={k} style={{ '--i': k }} />
                          ))}
                        </div>
                      </>
                    )}

                    <div className="playerHeader">
                      <div className="playerNameText">{teamName}</div>

                      <div className="playerStats">
                        <span>{thrown[teamIdx] || 0} {t(lang, 'darts')}</span>
                        <span>•</span>
                        <span>{t(lang, 'avg')}: {formatAvg(averages[teamIdx])}</span>
                        {members.length > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              {members.map((m, mi) => (
                                <span
                                  key={m.ix}
                                  style={{ fontWeight: m.ix === activePlayerIdx ? 900 : 400 }}
                                >
                                  {mi > 0 ? ', ' : ''}{m.name}
                                </span>
                              ))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="playerScore">
                      {scores[teamIdx] ?? 0}
                    </div>

                    <div className="playerTurn">
                      {[0, 1, 2].map(ix => {
                        const d = currentDarts[ix];
                        return (
                          <div key={ix} className="dartBox">
                            {d ? formatHit(d) : '-'}
                          </div>
                        );
                      })}
                      <div className="lastTotal">
                        {t(lang, 'last')}: {lastTurn[teamIdx] || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (mode === 'roulette' || mode === 'rouletteDouble') ? (
            /* ROULETTE layout */
            <div className="playersPane" data-premium={isPremium ? '1' : '0'}>
              {order.map((pIdx, i) => {
                const p = players[pIdx];
                const active = i === currIdx && winner == null;
                const currentDarts = active ? darts : [];
                const currentTarget = roulette?.currentTargets?.[pIdx] ?? null;
                const deckLeft = roulette?.decks?.[pIdx]?.length ?? 0;
                const remainingDarts = Math.max(0, 3 - currentDarts.length);
                const isDrawingNow = active && rouletteDrawing;
                const displayTarget = isDrawingNow ? rouletteSpinTarget : currentTarget;
                const canDraw = active && !rouletteDrawing && currentTarget == null && remainingDarts > 0 && deckLeft > 0;
                const canHit = active && !rouletteDrawing && currentTarget != null && remainingDarts > 0;

                return (
                  <div
                    key={p.id}
                    ref={node => { if (node) cardRefs.current[pIdx] = node; }}
                    className={'playerCard' + (active ? ' active' : '') + (winner === pIdx ? ' winner' : '')}
                    style={active ? activeStyle : undefined}
                  >
                    {winner === pIdx && (
                      <>
                        <div className="starburst" aria-hidden="true">
                          {Array.from({ length: 12 }).map((_, k) => (
                            <span key={k} style={{ '--k': k }} />
                          ))}
                        </div>
                        <div className="confetti" aria-hidden="true">
                          {Array.from({ length: 50 }).map((_, k) => (
                            <span key={k} style={{ '--i': k }} />
                          ))}
                        </div>
                      </>
                    )}

                    <div className="playerHeader">
                      <div className="playerNameText">{p.name}</div>
                      <div className="playerStats">
                        <span>{thrown[pIdx] || 0} {t(lang, 'darts')}</span>
                        <span>•</span>
                        <span>{t(lang, 'last')}: {lastTurn[pIdx] || 0}</span>
                      </div>
                    </div>

                    <div className="playerScore">
                      {t(lang, 'rouletteTotalPoints')}: {scores[pIdx] ?? 0}
                    </div>

                    <div className="playerTurn">
                      <div className="dartBox targetBox">
                        {rouletteTargetLabel(displayTarget)}
                      </div>
                      {[0, 1, 2].map(ix => {
                        const d = currentDarts[ix];
                        return (
                          <div key={ix} className="dartBox">
                            {d ? (d.score > 0 ? `+${d.score}` : '0') : '-'}
                          </div>
                        );
                      })}
                    </div>

                    {active && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <button
                          type="button"
                          className="btn"
                          onClick={runRouletteDraw}
                          disabled={!canDraw}
                        >
                          {t(lang, 'rouletteDrawButton')}
                        </button>

                        <button
                          type="button"
                          className="btn green"
                          onClick={() => {
                            const isLastDart = remainingDarts <= 1;
                            const shouldAutoDraw = remainingDarts > 1 && deckLeft > 0;

                            rouletteMarkHit();

                            if (shouldAutoDraw) setRouletteAutoDrawPending(true);
                            if (isLastDart) setRouletteAutoSwitchPending(true);
                          }}
                          disabled={!canHit}
                        >
                          {t(lang, 'rouletteHitButton')}
                        </button>

                        <button
                          type="button"
                          className="btn ghost"
                          onClick={rouletteSwitchPlayer}
                          disabled={rouletteDrawing}
                        >
                          {t(lang, 'rouletteSwitchButton')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : mode !== 'cricket' ? (
          /* CLASSIC / AROUND */
          <div className="playersPane" data-premium={isPremium ? '1' : '0'}>
            {order.map((pIdx, i) => {
              const p = players[pIdx];
              const active = i === currIdx && winner == null;
              const currentDarts = active ? darts : [];

              return (
                <div
                  key={p.id}
                  ref={node => { if (node) cardRefs.current[pIdx] = node; }}
                  className={'playerCard' + (active ? ' active' : '') + (winner === pIdx ? ' winner' : '')}
                  style={active ? activeStyle : undefined}
                >
                  {winner === pIdx && (
                    <>
                      <div className="starburst" aria-hidden="true">
                        {Array.from({ length: 12 }).map((_, k) => (
                          <span key={k} style={{ '--k': k }} />
                        ))}
                      </div>
                      <div className="confetti" aria-hidden="true">
                        {Array.from({ length: 50 }).map((_, k) => (
                          <span key={k} style={{ '--i': k }} />
                        ))}
                      </div>
                    </>
                  )}

                  <div className="playerHeader">
                    <div className="playerNameText">{p.name}</div>

                    {mode === 'classic' ? (
                      <div className="playerStats">
                        <span>{thrown[pIdx] || 0} {t(lang, 'darts')}</span>
                        <span>•</span>
                        <span>
                          {t(lang, 'avg')}: {formatAvg(averages[pIdx])}
                        </span>
                      </div>
                    ) : (
                      <div className="playerStats">
                        <span>
                          {t(lang, 'target')}: {around?.[pIdx]?.next ?? 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {mode === 'classic' ? (
                    <>
                      <div className="playerScore">
                        {scores[pIdx] ?? 0}
                      </div>
                      <div className="playerTurn">
                        {[0, 1, 2].map(ix => {
                          const d = currentDarts[ix];
                          return (
                            <div key={ix} className="dartBox">
                              {d ? formatHit(d) : '-'}
                            </div>
                          );
                        })}
                        <div className="lastTotal">
                          {t(lang, 'last')}: {lastTurn[pIdx] || 0}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="playerTurn">
                      <div className="dartBox targetBox">
                        {around?.[pIdx]?.next ?? 1}
                      </div>
                      {[0, 1, 2].map(ix => {
                        const d = currentDarts[ix];
                        return (
                          <div key={ix} className="dartBox">
                            {d
                              ? d.score
                                ? '✓'
                                : d.v === 0
                                  ? '0'
                                  : '-'
                              : '-'}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* CRICKET layout – levý sloupec + scroll hráčů, 7 řádků 1:1 */
          <div className="cricketWrap">
            {/* Levý pevný sloupec 15–25 */}
            <div className="targetsRail">
              <div
                className="targetsRailHead"
                style={{
                  height: HEAD_H,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="targetsRailTitle">
                  {t(lang, 'target')}
                </span>
              </div>

              <div className="targetsRailMarks">
                {cricketTargets.map(k => {
                  const lbl = k === 'bull' ? '25' : k;
                  return (
                    <div key={k} className="targetCell">
                      {lbl}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scrollovatelné sloupce hráčů */}
            <div className="cricketScroll" style={{ paddingBottom: PAD_H }}>
              {order.map((pIdx, i) => {
                const p = players[pIdx];
                const active = i === currIdx && winner == null;

                return (
                  <div
                    key={p.id}
                    ref={node => { if (node) cardRefs.current[pIdx] = node; }}
                    className={'playerCol' + (active ? ' active' : '') + (winner === pIdx ? ' winner' : '')}
                    style={active ? activeStyle : undefined}
                  >
                    <div
                      className="playerColHead"
                      style={{
                        height: HEAD_H,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '0 8px',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        className="playerColName"
                        style={{
                          fontWeight: 800,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name}
                      </div>
                      <div className="playerColPts">
                        {cricket?.[pIdx]?.points ?? 0}
                      </div>
                    </div>

                    <div className="playerColMarks">
                      {cricketTargets.map(k => {
                        const mk = cricket?.[pIdx]?.marks?.[k] ?? 0;
                        return (
                          <div
                            key={k}
                            className={'markCell' + (mk >= 3 ? ' closed' : '')}
                          >
                            {markSymbol(mk)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

          {/* PAD / KEYPAD */}
          {winner == null && !hideDartControls && (
            <div className="padPane">
              {mode === 'classic' && scoreInputMode === 'round' ? (
                <>
                  <div className="padRow">
                    <input
                      className="input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0–180"
                      value={roundScoreInput}
                      onChange={e => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 3);
                        setRoundScoreInput(clean);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitRoundScore();
                      }}
                      style={{
                        height: 44,
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'center',
                        fontSize: 20,
                        fontWeight: 900
                      }}
                    />

                    <button
                      type="button"
                      className="btn green"
                      onClick={submitRoundScore}
                      style={{ height: 44, minWidth: 86 }}
                    >
                      {t(lang, 'submitScore')}
                    </button>

                    <button
                      type="button"
                      className="multBtn backspace"
                      onClick={undo}
                      title={t(lang, 'undo')}
                      aria-label={t(lang, 'undo')}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="iconBackspace"
                        aria-hidden="true"
                      >
                        <path
                          d="M7 5L3 12l4 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M12 9l4 4m0-4-4 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div style={{ fontSize: 12, opacity: .75, textAlign: 'center', paddingTop: 4 }}>
                    {t(lang, 'roundTotalHint')}
                  </div>
                </>
              ) : hideDartControls ? null : (
                <>
                  {/* první řádek: DOUBLE / TRIPLE / undo */}
                  <div className="padRow">
                    <button
                      type="button"
                      className={'multBtn mult-2' + (mult === 2 ? ' active' : '')}
                      onClick={() => setMult(m => (m === 2 ? 1 : 2))}
                    >
                      DOUBLE
                    </button>

                    <button
                      type="button"
                      className={'multBtn mult-3' + (mult === 3 ? ' active' : '')}
                      onClick={() => setMult(m => (m === 3 ? 1 : 3))}
                    >
                      TRIPLE
                    </button>

                    <button
                      type="button"
                      className="multBtn backspace"
                      onClick={undo}
                      title={t(lang, 'undo')}
                      aria-label={t(lang, 'undo')}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="iconBackspace"
                        aria-hidden="true"
                      >
                        <path
                          d="M7 5L3 12l4 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M12 9l4 4m0-4-4 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* čísla */}
                  {keypad.map((row, ri) => (
                    <div key={`row-${row.join('-')}`} className="padRow">
                      {row.map(n => (
                        <button
                          type="button"
                          key={n}
                          className="key"
                          onPointerDown={e => {
                            e.currentTarget.classList.add('pressed');

                            // Cricket speciály:
                            if (mode === 'cricket') {
                              if (n === 0) {
                                setMult(1);
                                commitDart(0, 1);
                                return;
                              }
                              if (n === 25) {
                                commitDart(25, mult);
                                return;
                              }
                            }

                            commitDart(n);
                          }}
                          onPointerUp={e => {
                            e.currentTarget.classList.remove('pressed');
                          }}
                          onPointerLeave={e => {
                            e.currentTarget.classList.remove('pressed');
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
      </div>
    );
  }
export default App;