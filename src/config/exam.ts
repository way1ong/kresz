/**
 * Параметри теоретичного іспиту KRESZ, категорія B («Közlekedési alapismeretek»,
 * számítógépes elméleti vizsga — SZEV). Усі параметри іспиту зібрані тут.
 *
 * ОФІЦІЙНІ ДЖЕРЕЛА (перевірено 2026-11-22):
 *  1. 24/2005. (IV. 21.) GKM rendelet, 8. számú melléklet, 1.4. «Az elméleti vizsgáztatás
 *     főbb adatai», рядок «B, B1 / K»: kérdések száma 55, összpontértéke 75,
 *     megfelelés pontszáma 65, megengedett hibapontok száma 10, tiszta vizsgaidő 55 perc.
 *     https://njt.jog.gov.hu/jogszabaly/2005-24-20-0L
 *  2. KAV — «Tantervi és vizsgakövetelmények a „B” kategóriás járművezető-képző tanfolyamok
 *     számára», чинна редакція (hatályos: 2024. október 1.), розділ VII. A.:
 *     «…egy 55 kérdésből álló számítógépes, feleletválasztós tesztet kell sikeresen megoldani.
 *      A vizsga időtartama 55 perc. Az elérhető maximális pontszám 75 pont, melyből a sikeres
 *      vizsgához legalább 65 pontot kell elérni.»
 *     https://vizsgakozpont.hu/uploads/2024/dokumentumok/tantervi_es_vizsgakovetelmeny_b_kategoria_20241001_signed.pdf
 *     (редакція 2023 року діяла до 2024-09-30; параметри іспиту в ній ті самі).
 *
 * За тим самим документом KAV іспит охоплює три предмети: «Közlekedési alapismeretek»,
 * «Járművezetés elmélete» та «Szerkezeti és üzemeltetési ismeretek».
 */
export const EXAM_CONFIG = {
  // ---- ПЕРЕВІРЕНО за офіційними джерелами (див. вище) ----
  /** Кількість питань. */
  questionCount: 55,
  /** Загальний («чистий») час іспиту, хвилини. */
  durationMinutes: 55,
  /** Максимальна кількість балів. */
  maxPoints: 75,
  /** Прохідний поріг, балів (тобто дозволено щонайбільше 10 штрафних балів). */
  passPoints: 65,

  /**
   * Не параметр іспиту, а налаштування вибірки: щонайбільше стільки згенерованих питань
   * «на розпізнавання» (назва знака, термін) потрапляє в один пробний іспит,
   * щоб вони не витісняли питання про правила.
   */
  maxRecognitionQuestions: 6,

  // ---- ОФІЦІЙНО НЕ ПІДТВЕРДЖЕНО: в офіційних документах цього немає ----
  /**
   * Скільки питань оцінюється в 3 бали (решта — по 1 балу).
   * Офіційні документи наводять лише суму (55 питань, 75 балів). Поділ «10 питань по 3 бали
   * + 45 по 1 балу» одностайно описують неофіційні джерела (автошколи, навчальні сайти);
   * за ними 3 бали дають питання про перевагу / черговість проїзду та дорожні ситуації.
   * У контенті 3 бали (поле "points": 3) мають питання про пріоритет — за цим описом.
   */
  threePointQuestions: 10,
  /**
   * Режим «як у програмі іспиту». Офіційно визначено тільки загальний час — 55 хвилин;
   * офіційного опису програми знайти не вдалося. Автошкола Jogsiközpont описує її так:
   * «Egy kérdésre 1 perc jut. Ha egy kérdésnél nem válaszolsz, és tovább lépsz, a rendszer
   * a teszt végén újra fel fogja tenni, de a rendelkezésre álló időt az előző próbálkozásnál
   * eltöltött idővel csökkenti.» За іншими неофіційними описами, повернутися до попереднього
   * питання не можна. Цей режим відтворює саме таку поведінку.
   * Другий режим («вільний») рахує лише загальний час і дозволяє гортати питання.
   */
  programMode: {
    /** Час на одне питання, секунди. */
    perQuestionSeconds: 60,
  },
} as const

export const EXAM_SOURCE = {
  label: '24/2005. (IV. 21.) GKM rendelet 8. melléklet 1.4.; KAV – Tantervi és vizsgakövetelmények, „B” kategória (hatályos: 2024.10.01.)',
  urls: [
    'https://njt.jog.gov.hu/jogszabaly/2005-24-20-0L',
    'https://vizsgakozpont.hu/uploads/2024/dokumentumok/tantervi_es_vizsgakovetelmeny_b_kategoria_20241001_signed.pdf',
  ],
  checkedAt: '2026-11-22',
} as const

/** Ключі перекладів для переліку офіційно не підтверджених параметрів (показуються перед іспитом). */
export const EXAM_UNVERIFIED = ['exam.unverified.points', 'exam.unverified.flow'] as const
