import vine from '@vinejs/vine'

/**
 * VineJS 4 n'a pas de regle native "multiple de" : la note (0 a 10) avance
 * par pas de 0,5, comme le selecteur du frontend et la colonne DECIMAL.
 */
const halfStep = vine.createRule((value, _options, field) => {
  if (typeof value === 'number' && !Number.isInteger(value * 2)) {
    field.report('The {{ field }} field must be a multiple of 0.5', 'halfStep', field)
  }
})

export const ratingSchema = () => vine.number().min(0).max(10).use(halfStep())
