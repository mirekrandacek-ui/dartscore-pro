export const RULES = [
  {
    key: 'x01',
    name: 'X01 (301/501)',
    text:
      'Cíl: z počátečního skóre (301 nebo 501) přesně na nulu. Po každém hodu se skóre odečítá. Ukončení (Single-Out / Double-Out / Triple-Out / Master-Out) určuje, jakým zásahem smíš hru uzavřít: ' +
      'Single-Out = jakýkoli zásah, Double-Out = výhradně Double (2 body za segment) nebo 50 (Double Bull), Triple-Out = výhradně Triple (3 body za segment), Master-Out = Double nebo Triple (případně 50). ' +
      'Hodnota zásahu: Single = 1× číslo, Double = 2× číslo, Triple = 3× číslo, Bull = 25 (Single Bull) / 50 (Double Bull). Přestřelení (méně než 0) = bez skóre (bust).'
  },
  {
    key: 'cricket',
    name: 'Cricket',
    text:
      'Cíl: čísla 15–20 a Bull. Single = 1 bod do „otevření“, Double = 2 body, Triple = 3 body. Číslo se „uzavře“ po třech bodech (např. Single+Single+Single / Double+Single / Triple). ' +
      'Můžeš bodovat navíc na číslech, která máš otevřená a soupeř ne. Bull: Single Bull = 25 (počítá jako 1 bod), Double Bull = 50 (počítá jako 2 body). Vyhrává ten, kdo jako první uzavře všechna čísla a současně vede na body.'
  },
  {
    key: 'around',
    name: 'Around the Clock',
    text:
      'Cíl: postupně zasáhnout 1 → 20 → Bull. Každé číslo se počítá po zásahu alespoň Single (Single = 1 bod, Double = 2 body, Triple = 3 body — pro postup stačí jakýkoli zásah daného čísla). Vyhrává ten, kdo jako první dokončí Bull.'
  },
  {
    key: 'shanghai',
    name: 'Shanghai',
    text:
      'Kolo má přiřazené cílové číslo (1. kolo = 1, 2. = 2, ...). Body získáš pouze z aktuálního cíle: Single = 1× číslo, Double = 2× číslo, Triple = 3× číslo. Okamžitá výhra („Shanghai“) je, když v jednom kole hodíš Single + Double + Triple cílového čísla.'
  }
]
