import { axiosInstance } from './client';
import { createMethods } from './factory';

export const { del, get, getFile, patch, post, put } = createMethods(axiosInstance);
