export class AccessDeniedError extends Error {
  constructor(public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN') {
    super('Access denied')
  }
}
