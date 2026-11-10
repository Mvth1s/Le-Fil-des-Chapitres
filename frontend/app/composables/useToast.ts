export type ToastType = 'success' | 'error'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

export const TOAST_DURATION_MS = 5000

let nextId = 0

// Minuteurs des toasts de succes, hors de useState : un handle de setTimeout
// n'est pas serialisable et n'a de sens que cote client.
interface Timer {
  handle: ReturnType<typeof setTimeout> | null
  remaining: number
  startedAt: number
}
const timers = new Map<number, Timer>()
let paused = false

// Etat partage via useState : une seule pile de toasts pour toute
// l'application, affichee par AppToast monte une fois dans app.vue.
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer?.handle) clearTimeout(timer.handle)
    timers.delete(id)
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function start(id: number, timer: Timer) {
    timer.startedAt = Date.now()
    timer.handle = setTimeout(() => {
      dismiss(id)
    }, timer.remaining)
  }

  function show(type: ToastType, message: string) {
    const id = ++nextId
    toasts.value = [...toasts.value, { id, type, message }]
    // Les erreurs restent jusqu'a fermeture manuelle : un message d'echec
    // ne doit pas disparaitre avant d'avoir ete lu.
    if (type === 'success' && import.meta.client) {
      const timer: Timer = { handle: null, remaining: TOAST_DURATION_MS, startedAt: 0 }
      timers.set(id, timer)
      if (!paused) start(id, timer)
    }
    return id
  }

  // Suspend tous les minuteurs (survol ou focus de la zone des toasts).
  function pause() {
    if (paused) return
    paused = true
    for (const timer of timers.values()) {
      if (!timer.handle) continue
      clearTimeout(timer.handle)
      timer.handle = null
      timer.remaining -= Date.now() - timer.startedAt
    }
  }

  function resume() {
    if (!paused) return
    paused = false
    for (const [id, timer] of timers) start(id, timer)
  }

  return {
    toasts,
    success: (message: string) => show('success', message),
    error: (message: string) => show('error', message),
    dismiss,
    pause,
    resume,
  }
}
