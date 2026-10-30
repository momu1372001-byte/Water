/**
 * A simple utility Record type — a plain object mapping string keys to values of type T.
 * Named `Record` to avoid confusion with the built-in `Record` utility when imported.
 * Usage: `import type { Record } from '@/lib/types'`
 */
export type Record<K extends string, V> = { [P in K]: V };
