import type { Register } from 'rizom';

export type GetRegisterType<K extends keyof Register> = Register[K];
