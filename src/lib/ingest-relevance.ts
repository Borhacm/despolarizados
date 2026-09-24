import { normalizeForMatch } from "@/lib/title-similarity";

/**
 * Misma lógica que en ingesta: lotería de resultados, crónica deportiva de liga, avances
 * de ficción. Centralizado para poder purgar artículos ya indexados.
 */

const RE_LOTTERY_TOPICS =
  /\b(bonoloto|primitiva|euromill(ones?|on|ion|ions)|euro\s+mill(ones?|on|ion|ions)|lae|gordo|quiniela|loterias?|apuestas del estado|onlae|cuponazo|el\s+cupon|cupon( de|azo)?)\b/;

function isLotteryOrSorteoTopic(text: string): boolean {
  return (
    RE_LOTTERY_TOPICS.test(text) ||
    /\b(sorteo|sorteos|once|cupon)\b/.test(text) ||
    /\b(el|la) (gordo|nino) (de|del)\b/.test(text) ||
    /\bloteria (de|del) (nino|navidad)\b/.test(text)
  );
}

function isSorteoLoteriaNewsworthyException(text: string): boolean {
  if (!isLotteryOrSorteoTopic(text)) return false;
  if (
    /\b(bote|botes|jackpot|jackpots|en juego|en (el )?bote|acumulad[oa][s]?|repartir[ae]|sin (ningun )?acertante|sin acertantes|boleto premiado|no hay (ningun )?acertante|buscan al|buscando (al|el) ganador|boleto valido en|mayor premio|record|historico|historica|millones? (de|en) (euros?|bote|premi)|bati(endo|o) (el |la )?record|llega? (a|al))\b/.test(
      text,
    )
  ) {
    return true;
  }
  if (
    /\b(asciende?|alcanz|bati(endo|do)?|sube|lleg(ando|o) (a|al|el)|llega (a|al|el|los)|roza|sigue subiendo|supera?)\b/.test(
      text,
    ) &&
    /\b(bote|jackpot|mill(ones?|on))\b/.test(text)
  ) {
    return true;
  }
  return false;
}

function isLotteryLowValue(text: string): boolean {
  if (isSorteoLoteriaNewsworthyException(text)) return false;
  if (!isLotteryOrSorteoTopic(text)) return false;

  if (
    /\b(resultado|reintegro|numero complementario|reparto|cifras( ganador| premiad[oa]s?)?|complementari[ao]|combinacion( ganador| premiad[oa]s?)?|(los|las) numeros( del| de la)|numeros premiados)\b/.test(
      text,
    )
  ) {
    return true;
  }
  if (/\b(premio|premios)\b/.test(text)) {
    if (
      /\b(mayor|bote|record|histo(rico|rica)?|acumul|en juego)\b/.test(text) ||
      /\bmillones? de\b/.test(text)
    ) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Fútbol de **selecciones** (Mundial, Euro) y otras cimas; no excluimos.
 */
function isMundialOrEurocopaException(text: string): boolean {
  if (/\b(mundial|eurocopa)\b/.test(text)) return true;
  if (/\bcopa\s+del\s+mundo\b/.test(text)) return true;
  if (/\bcampeonato\s+del\s+mundo\b/.test(text)) return true;
  if (/\beuro\s+copa\b/.test(text)) return true;
  if (/\buefa\s+euro\b/.test(text) || /\bworld\s+cup\b/.test(text)) return true;
  if (/\beuro\s+20\d{2}\b/.test(text)) return true;
  if (/\bcopa\s+del\s+mundo\s+20\d{2}\b/.test(text)) return true;
  return false;
}

/**
 * Fútbol/baloncesto de club, pista, y tenis ATP/WTA. Texto en minúsculas (normalizeForMatch).
 * Incl. Roland Garros, Masters, pistas para excluir crónicas/ATP salvo excepciones de selección arriba.
 */
const RE_CLUB_PRO_SPORTS =
  /\b(champions(\s+league)?|liga(\s+de)?\s+campeones|laliga|la\s+liga|primera(\s+division)?|segunda(\s+division)?|copa(\s+del)?\s+rey|supercopa(\s+de(\s+la)?\s+espana)?|europa\s+league|uefa\s+europa|conference\s+league|euroliga|euroleague|euro\s+cup|eurocup|liga\s+(acb|endesa)|\bacb\b|baloncest\w*|basket( |$|ball)|premier(\s+league)?|bundesliga|eredivisie|ligue\s*1|serie\s*a|mls|santiago\s*bern|bernabeu|wanda|metropolitano|sanchez\s*pizjuan|la\s+cartuja|camp\s*nou|mestalla|ramon\s*sanchez|palau|san\s*mames|anoeta|balaidos|benito\s+villamarin|nuevo\s+los\s+carmenes|ciutat de valencia|butarque|roland\s*garros|wimbledon|australian\s*open|us\s*open|\batp\b|\bwta\b|davis(\s+cup)?|itf|masters( 1000)?|m1000|mutua( madrid)?|cuadro( final| masculino| femenino| principal)?|tenis\w*|pista( central( de( tenis)?)?| de( tenis))|grand\s*slam|gira\s*atp|gira\s*wta)\b/;

/**
 * Crónica, retransmisión, galería; bajas explícitas en un solo patrón; el resto en
 * `RE_SPORTS_MED_BAJA` (lesión, baja, sin Grand Slam, anuncia que no…).
 */
const RE_SPORTS_MATCH_OR_COLUMN =
  /\b(resultado|retransmi\w*|directo|en\s*vivo|minuto(\s+a(\s+)?minuto)?|partid\w*|jornad\w*|marcador|tanteo|gol( |$|es|s|azo|ead\w*)?|futbol\w*|despid\w*|despedida|elimin\w*|cuartos|semifin\w*|\bsemis\b|final(\s*|\s)four|finalista|paliz\w*|golead\w*|remont\w*|derbi\w*|racha\w*|tanda(\s+de)?( penalt\w*)?|penal\w*|penalti\w*|porter\w*|no\s*tiene\s*remedio|sin\s*remedio\w*|confirma(\s+en|\s+que)|\b(gana|pierde|empat)\w*|\bclasifica\w*|\b(ataque|defen)\w*|imagen\w*|\bfotos?\b|fotogaler(ia\w*)?|galer(ia\w*)?|aplast\w*|\b(top1?0|top-10|top 10|top-5|top-8|top(10|4|2|1))\b|retir\w*|\bsets?\b|saqu\w*|volea\w*|ranking(\s*atp|\s*wta)|asusta|lesion\w*|\b(de|da( de)) baja\b)\b/;

/** Baja, lesión, sin Roland / sin disputar, anuncia que (no)… — sin crónica de puntuación. */
const RE_SPORTS_MED_BAJA =
  /lesion\w*|\b(de|da( de)) baja\b|sin (?:\s*roland\w*|\s+wimbledon\w*|\s+australian( open\w*)?|us open|el open( de( par(í|i)s\w*|\w*)?|par(í|i)\w*)|\bcomplej\w+ (lesion\w*|\w*lesion\w*|\s*proces)|\b(no|sin) (defiend(era?|a|a)|defend(era?|a|a))\w*|\b(no|sin) (jugar|compet(ira?|a|a|e|ir)\w*)\b|inflam\w*|\bproces\w+ (complej\w*|\w* complic\w*|\w*larg(ado|a|a|o)\w*)|(carti(lago|a)|cari(lago|a))(\w*|\b)|tend(ón|on|onitis|initis)\w*|rehabilit\w*|anunc(ia?|a|a|ó)\w* que( no( va| podr(á|a)|\b| defender\w*|\b)| su (baja|retirad\w*)))/;

/**
 * Excluimos crónica deportiva de **clubes**, galerías de partido y **ATP/tenis**
 * (salvo excepciones de selecciones: Mundial, Euro, etc.).
 */
function isClubProSportsLowValue(text: string): boolean {
  if (isMundialOrEurocopaException(text)) return false;
  if (!RE_CLUB_PRO_SPORTS.test(text)) return false;
  if (RE_SPORTS_MATCH_OR_COLUMN.test(text)) return true;
  return RE_SPORTS_MED_BAJA.test(text);
}

function isTvSeriesAdvanceLowValue(title: string, summary: string): boolean {
  const raw = `${title} ${summary}`;
  if (
    /\bavance de\s+[\u2018\u2019'"\u201c\u201d«»]/i.test(raw) &&
    /\bde hoy\b/i.test(raw)
  ) {
    return true;
  }
  const text = normalizeForMatch(`${title} ${summary}`);
  if (!text) return false;
  if (
    /\bavance de\b/.test(text) &&
    /\bde hoy\b/.test(text) &&
    /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/.test(text)
  ) {
    return true;
  }
  return false;
}

/**
 * Misma regla que `runIngest`: descarta cuerpos de poca cita o resultados tontos.
 */
export function shouldExcludeLowValueNews(title: string, summary: string): boolean {
  const text = normalizeForMatch(`${title} ${summary}`);
  if (!text) return false;
  return (
    isLotteryLowValue(text) || isClubProSportsLowValue(text) || isTvSeriesAdvanceLowValue(title, summary)
  );
}
