// Format des erreurs 422 renvoyees par VineJS (backend, comportement par
// defaut d'AdonisJS, non personnalise dans app/exceptions/handler.ts).
interface VineErrorBody {
  errors?: Array<{ field: string; message: string }>
}

// $fetch (ofetch) leve une FetchError dont la propriete `data` contient le
// corps JSON de la reponse d'erreur. On la retype ici plutot que d'importer
// FetchError, pour ne pas dependre d'un detail d'implementation d'ofetch.
export function extractValidationErrors(error: unknown): Record<string, string> {
  const body = (error as { data?: VineErrorBody } | undefined)?.data

  if (!body?.errors) {
    return {}
  }

  const fieldErrors: Record<string, string> = {}
  for (const item of body.errors) {
    if (!(item.field in fieldErrors)) {
      fieldErrors[item.field] = item.message
    }
  }
  return fieldErrors
}
