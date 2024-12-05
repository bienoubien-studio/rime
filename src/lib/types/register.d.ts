import type { Register } from 'rizom/index.js';

export type GetRegisterType<K extends keyof Register> = Register[K];
