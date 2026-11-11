import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  /**
   * The bodyparser middleware will parse the request body
   * for the following HTTP methods.
   */
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Config for the "application/x-www-form-urlencoded"
   * content-type parser
   */
  form: {
    convertEmptyStringsToNull: true,
    limit: '100kb',
    types: ['application/x-www-form-urlencoded'],
  },

  /**
   * Config for the JSON parser
   */
  json: {
    convertEmptyStringsToNull: true,
    // A webtoon with its description stays far below this limit.
    limit: '100kb',
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  /**
   * Multipart disabled: no upload exists (cover_url only accepts external
   * URLs, CLAUDE.md section 11). An empty "types" list means no request is
   * ever treated as multipart, so nothing is written to the tmp folder.
   */
  multipart: {
    autoProcess: false,
    convertEmptyStringsToNull: true,
    processManually: [],
    limit: '100kb',
    types: [],
  },
})

export default bodyParserConfig
