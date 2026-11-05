import { axiosInstance } from './client';
import { createMethods } from './factory';

export const { del, get, patch, post, put } = createMethods(axiosInstance);
