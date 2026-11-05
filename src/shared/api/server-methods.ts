import { createMethods } from './factory';
import { serverAxiosInstance } from './server';

export const { del, get, patch, post, put } = createMethods(serverAxiosInstance);
