/**
 * Параметри теоретичного іспиту KRESZ, категорія B («Közlekedési alapismeretek»,
 * számítógépes elméleti vizsga). Усі параметри іспиту зібрані тут.
 *
 * ДЖЕРЕЛО (перевірено 2026-11-22):
 *   KAV Közlekedési Alkalmassági és Vizsgaközpont — «Tantervi és vizsgakövetelmények
 *   a „B” kategóriás járművezető-képző tanfolyamok számára», 2023 (підписано 2023-08-22),
 *   розділ VII. A. Közlekedési alapismeretek:
 *     «A vizsga teljesítéséhez egy 55 kérdésből álló számítógépes, feleletválasztós tesztet
 *      kell sikeresen megoldani. A vizsga időtartama 55 perc. Az elérhető maximális pontszám
 *      75 pont, melyből a sikeres vizsgához legalább 65 pontot kell elérni.»
 *   https://vizsgakozpont.hu/uploads/2023/dokumentumok/tantervi_es_vizsgakov_b_kategoria_2023_alairt.pdf
 *
 * Чи це найновіша редакція документа — НЕ перевірено: перед іспитом варто глянути
 * на vizsgakozpont.hu, чи немає новішої версії.
 */
export const EXAM_CONFIG = {
  // ---- ПЕРЕВІРЕНО за документом KAV (див. вище) ----
  /** Кількість питань. */
  questionCount: 55,
  /** Загальний час, хвилини. */
  durationMinutes: 55,
  /** Максимальна кількість балів. */
  maxPoints: 75,
  /** Прохідний поріг, балів. */
  passPoints: 65,

  // ---- НЕПЕРЕВІРЕНО: у документі KAV цього немає ----
  /**
   * НЕПЕРЕВІРЕНО. Скільки питань оцінюється в 3 бали (решта — по 1 балу).
   * Це лише арифметичний висновок: 55 питань і 75 балів за умови, що питання
   * коштують 1 або 3 бали, дають 10 × 3 + 45 × 1. Сам поділ на 1 і 3 бали
   * та те, які саме теми «трибальні», офіційним джерелом не підтверджено.
   * У контенті 3 бали (поле "points": 3) мають питання про пріоритет — це припущення.
   */
  threePointQuestions: 10,
  /**
   * НЕПЕРЕВІРЕНО. Окремий ліміт часу на одне питання, секунди (null — немає).
   * Документ 2023 року згадує «kérdésenként 1 perc» лише в перехідних положеннях
   * (для іспитів 24.08–04.09.2023), тож тут діє тільки загальний ліміт часу.
   */
  perQuestionSeconds: null as number | null,
  /**
   * НЕПЕРЕВІРЕНО. Чи можна на справжньому іспиті повертатися до попередніх питань.
   * Тут навігацію дозволено.
   */
  allowNavigation: true,
} as const

export const EXAM_SOURCE = {
  label: 'KAV – Tantervi és vizsgakövetelmények, „B” kategória (2023), VII. A.',
  url: 'https://vizsgakozpont.hu/uploads/2023/dokumentumok/tantervi_es_vizsgakov_b_kategoria_2023_alairt.pdf',
  checkedAt: '2026-11-22',
} as const

/** Ключі перекладів для переліку неперевірених параметрів (показуються перед іспитом). */
export const EXAM_UNVERIFIED = ['exam.unverified.points', 'exam.unverified.flow'] as const
