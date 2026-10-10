// Pure X01 predicates shared by runtime and Node tests.
export const isSupportedX01 = game =>
  game?.mode === 'classic'
  && [101, 301, 501, 701, 901].includes(Number(game.startScore));

export const isQuickClassic = game =>
  game?.mode === 'classic'
  && [101, 301].includes(Number(game.startScore))
  // The match-format UI represents one leg and one set as 1 / 1.
  && Number(game.legsToWinSet) >= 0 && Number(game.legsToWinSet) <= 1
  && Number(game.setsToWin) >= 0 && Number(game.setsToWin) <= 1;

export const hasRecordedScore = game =>
  (game?.actions?.length || 0) > 0
  || (game?.darts?.length || 0) > 0
  || (game?.thrown || []).some(n => Number(n) > 0)
  || (game?.scores || []).some(n => Number(n) < Number(game.startScore))
  || (game?.classicVisitHistory?.length || 0) > 0
  || (game?.classicLegsWon || []).some(n => Number(n) > 0)
  || (game?.classicSetsWon || []).some(n => Number(n) > 0);
