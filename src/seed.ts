import type { Exercise, Template, TemplateExercise } from './db'

const photos = (slug: string) => [`exercises/${slug}-0.webp`, `exercises/${slug}-1.webp`]

export const SEED_EXERCISES: Exercise[] = [
  // ---- Workout A ----
  {
    id: 'incline-db-bench-press',
    name: 'Incline DB Bench Press',
    equipment: 'dumbbell',
    increment: 2,
    images: photos('incline-db-bench-press'),
    cues: [
      'ספסל בשיפוע של 30 עד 45 מעלות, שכמות לאחור ולמטה',
      'הורד לאט עד גובה החזה, מרפקים בזווית של כ-45 מעלות מהגוף',
      'דחוף למעלה בלי להקיש את המשקולות ובלי לנעול מרפקים',
    ],
  },
  {
    id: 'pec-deck',
    name: 'Machine Pec Deck',
    equipment: 'machine',
    increment: 2.5,
    images: photos('pec-deck'),
    cues: [
      'גב צמוד למשענת, ידיות בגובה החזה',
      'מרפקים כפופים מעט וקבועים לאורך כל התנועה',
      'קרב ידיים, החזק שנייה בכיווץ וחזור לאט',
    ],
  },
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    equipment: 'machine',
    increment: 2.5,
    images: photos('shoulder-press'),
    cues: [
      'כוון את המושב כך שהידיות בגובה הכתפיים',
      'גב צמוד למשענת ובטן אסופה, בלי קשת בגב התחתון',
      'דחוף עד כמעט יישור מלא וחזור בשליטה',
    ],
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    equipment: 'cable',
    increment: 2.5,
    images: ['exercises/cable-lateral-raise.svg'],
    cues: [
      'כבל מגובה נמוך, אחיזה ביד הרחוקה מהמכונה',
      'הובל עם המרפק והרם עד גובה הכתף, לא מעבר',
      'בלי תנופה – רד לאט במשך 2-3 שניות',
    ],
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    equipment: 'machine',
    increment: 2.5,
    images: photos('seated-leg-curl'),
    cues: [
      'ציר הברך מול ציר המכונה, כרית מעל העקב',
      'הורד את כרית הירכיים כך שהירכיים נעולות',
      'כופף עד הסוף, החזק רגע וחזור לאט',
    ],
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    equipment: 'machine',
    increment: 2.5,
    images: photos('leg-extension'),
    note: 'אם יש כאב בברך, לעבוד בטווח 90 עד 30 מעלות בלי נעילה מלאה.',
    cues: [
      'ציר הברך מול ציר המכונה, כרית מעל הקרסול',
      'יישר בשליטה והחזק שנייה למעלה',
      'רד לאט, בלי להקפיץ את המשקולות',
    ],
  },
  {
    id: 'overhead-cable-triceps-extension',
    name: 'Overhead Cable Triceps Extension',
    equipment: 'cable',
    increment: 2.5,
    images: photos('overhead-cable-triceps-extension'),
    cues: [
      'גב לכבל, צעד קדימה, מרפקים מכוונים קדימה וקרובים לראש',
      'רד עמוק למתיחה מאחורי הראש',
      'יישר רק מהמרפק – הזרוע העליונה לא זזה',
    ],
  },
  {
    id: 'cable-triceps-pushdown',
    name: 'Cable Triceps Pushdown',
    equipment: 'cable',
    increment: 2.5,
    images: photos('cable-triceps-pushdown'),
    cues: [
      'מרפקים צמודים לגוף ונעולים במקום',
      'דחוף עד יישור מלא ופשק מעט את החבל בסוף',
      'חזור לאט עד 90 מעלות, בלי להרים כתפיים',
    ],
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    equipment: 'cable',
    increment: 2.5,
    images: photos('cable-crunch'),
    cues: [
      'על הברכיים, חבל ליד הראש, הירכיים לא זזות',
      'עגל את הגב והבא מרפקים לכיוון הירכיים',
      'הכוח מהבטן – לא למשוך עם הידיים',
    ],
  },
  // ---- Workout B ----
  {
    id: 'pull-up',
    name: 'Pull-Up',
    equipment: 'bodyweight',
    increment: 2.5,
    images: photos('pull-up'),
    cues: [
      'אחיזה מעט רחבה מהכתפיים, מתחילים מתלייה מלאה',
      'משוך מרפקים למטה לכיוון המותניים, חזה למוט',
      'סנטר מעל המוט ורד לאט עד יישור מלא',
    ],
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    equipment: 'barbell',
    increment: 2.5,
    images: photos('t-bar-row'),
    cues: [
      'גב ישר, ירכיים לאחור, פלג גוף עליון בזווית של כ-45 מעלות',
      'משוך לכיוון הבטן וקרב שכמות בסוף התנועה',
      'בלי תנופה מהגב התחתון',
    ],
  },
  {
    id: 'close-grip-lat-pulldown',
    name: 'Close-Grip Lat Pulldown',
    equipment: 'cable',
    increment: 2.5,
    images: photos('close-grip-lat-pulldown'),
    cues: [
      'אחיזה צרה, ירכיים נעולות מתחת לכרית',
      'הישען מעט לאחור ומשוך לחזה העליון',
      'מרפקים צמודים לגוף, שחרר לאט עד מתיחה מלאה',
    ],
  },
  {
    id: 'reverse-pec-deck',
    name: 'Reverse Pec Deck',
    equipment: 'machine',
    increment: 2.5,
    images: photos('reverse-pec-deck'),
    cues: [
      'חזה צמוד לכרית, ידיות בגובה הכתפיים',
      'פתח ידיים לצדדים עם מרפקים כפופים מעט',
      'הובל עם גב כף היד, בלי לכווץ שכמות חזק',
    ],
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    equipment: 'dumbbell',
    increment: 1,
    images: photos('incline-dumbbell-curl'),
    cues: [
      'ספסל בשיפוע של 45 עד 60 מעלות, ידיים תלויות ישר מתחת לכתפיים',
      'כופף בלי להזיז את המרפקים קדימה',
      'רד עד יישור מלא כדי להרגיש מתיחה',
    ],
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    equipment: 'barbell',
    increment: 2.5,
    images: photos('preacher-curl'),
    cues: [
      'בית השחי צמוד לראש הכרית, זרוע עליונה שטוחה',
      'רד כמעט עד יישור, בלי להקפיץ בתחתית',
      'עלה בשליטה וכווץ למעלה',
    ],
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    equipment: 'dumbbell',
    increment: 2,
    images: photos('hammer-curl'),
    cues: [
      'אחיזה ניטרלית – כפות הידיים פונות זו לזו',
      'מרפקים צמודים לגוף, בלי נדנוד',
      'עלה עד הכתף ורד לאט',
    ],
  },
  {
    id: 'db-wrist-curl',
    name: 'DB Wrist Curls',
    equipment: 'dumbbell',
    increment: 1,
    images: photos('db-wrist-curl'),
    cues: [
      'אמות על הירכיים, פרקי כף היד מעבר לברכיים',
      'כפות למעלה: תן למשקולת להתגלגל לאצבעות ואז כופף',
      'רק פרק כף היד זז – טווח מלא ולאט',
    ],
  },
]

type Row = [exerciseId: string, sets: number, repMin: number, repMax: number, rest: number]

const rows = (tpl: string, list: Row[]): TemplateExercise[] =>
  list.map(([exerciseId, sets, repMin, repMax, rest], i) => ({
    key: `${tpl}-${i}`,
    exerciseId,
    sets,
    repMin,
    repMax,
    rest,
  }))

export const SEED_TEMPLATES: Template[] = [
  {
    id: 'tpl-a',
    name: 'A',
    subtitle: 'חזה · כתפיים · יד אחורית · רגליים · בטן',
    order: 0,
    exercises: rows('a', [
      ['incline-db-bench-press', 3, 6, 10, 150],
      ['pec-deck', 2, 10, 15, 90],
      ['shoulder-press', 2, 8, 10, 120],
      ['cable-lateral-raise', 3, 10, 15, 90],
      ['seated-leg-curl', 3, 8, 12, 90],
      ['leg-extension', 3, 10, 15, 90],
      ['overhead-cable-triceps-extension', 3, 10, 12, 90],
      ['cable-triceps-pushdown', 2, 10, 15, 60],
      ['cable-crunch', 2, 10, 15, 60],
    ]),
  },
  {
    id: 'tpl-b',
    name: 'B',
    subtitle: 'גב · כתף אחורית · יד קדמית · אמה · בטן',
    order: 1,
    exercises: rows('b', [
      ['pull-up', 3, 6, 10, 150],
      ['t-bar-row', 3, 8, 10, 120],
      ['close-grip-lat-pulldown', 2, 10, 12, 90],
      ['reverse-pec-deck', 3, 12, 15, 60],
      ['incline-dumbbell-curl', 2, 10, 12, 60],
      ['preacher-curl', 2, 8, 12, 60],
      ['hammer-curl', 2, 10, 12, 60],
      ['db-wrist-curl', 2, 12, 20, 60],
      ['cable-crunch', 2, 10, 15, 60],
    ]),
  },
]
