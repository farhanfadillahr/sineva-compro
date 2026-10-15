import type { UserActionState } from '../types'
export function ActionFeedback({ state, id }: { state: UserActionState; id: string }) {
  if (state.status === 'idle') return null
  return (
    <p
      id={id}
      className={state.status === 'error' ? 'form-error' : 'form-success'}
      role={state.status === 'error' ? 'alert' : 'status'}
    >
      {state.message}
    </p>
  )
}
