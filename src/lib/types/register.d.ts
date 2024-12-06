import type { Register } from '../index.js';

export type GetRegisterType<K extends keyof Register> = Register[K];
