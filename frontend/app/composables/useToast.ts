export type ToastType = 'success' | 'error'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

const TOAST_DURATION_MS = 5000

let nextId = 0

// Etat partage via useState : une seule pile de toasts pour toute
// l'application, affichee par AppToast monte une fois dans app.vue.
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function show(type: ToastType, message: string) {
    const id = ++nextId
    toasts.value = [...toasts.value, { id, type, message }]
    if (import.meta.client) {
      setTimeout(() => {
        dismiss(id)
      }, TOAST_DURATION_MS)
    }
    return id
  }

  return {
    toasts,
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
    dismiss,
  }
}
