/**
 * Options communes aux champs URL (coverUrl, link) : ces valeurs sont
 * rendues telles quelles dans des attributs href/src cote frontend, donc
 * seuls http et https sont acceptes (refus de javascript:, data:, ftp:...).
 */
export const HTTP_URL = {
  protocols: ['http', 'https'],
  require_protocol: true,
}
