// Les 9 degrades de couverture du UI kit (data.jsx, objet G), construits sur
// les quatre teintes de la charte. Utilises pour la couverture generee (V4).
export const COVER_GRADIENTS = {
  sage: 'linear-gradient(155deg, #B6C399 0%, #8B9B6A 60%, #6F7F4F 100%)',
  blue: 'linear-gradient(160deg, #C5D6E2 0%, #8FAEC5 55%, #6E8FAA 100%)',
  rose: 'linear-gradient(165deg, #E5C7CE 0%, #C89BA5 55%, #A77B86 100%)',
  beige: 'linear-gradient(150deg, #ECDFC0 0%, #D4C4A0 55%, #B6A37D 100%)',
  sageRose: 'linear-gradient(160deg, #B6C399 0%, #C89BA5 100%)',
  blueRose: 'linear-gradient(160deg, #8FAEC5 0%, #C89BA5 100%)',
  beigeBlue: 'linear-gradient(160deg, #D4C4A0 0%, #8FAEC5 100%)',
  beigeSage: 'linear-gradient(160deg, #D4C4A0 0%, #8B9B6A 100%)',
  goldNight: 'linear-gradient(165deg, #3D3B2F 0%, #5F543E 60%, #C9A96E 100%)',
} as const

export type CoverGradientKey = keyof typeof COVER_GRADIENTS
