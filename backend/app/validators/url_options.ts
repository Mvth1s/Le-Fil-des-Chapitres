/**
 * Options communes aux champs URL : ces valeurs sont rendues telles quelles
 * dans des attributs href/src cote frontend (refus de javascript:, data:, ftp:...).
 * - HTTP_URL (link) : http et https.
 * - HTTPS_URL (coverUrl) : https seul, pour eviter le contenu mixte sur le
 *   site servi en https.
 */
export const HTTP_URL = {
  protocols: ['http', 'https'],
  require_protocol: true,
}

export const HTTPS_URL = {
  protocols: ['https'],
  require_protocol: true,
}
