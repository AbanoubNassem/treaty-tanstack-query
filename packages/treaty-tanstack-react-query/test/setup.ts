import { notifyManager } from '@tanstack/react-query';
import { act, cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

beforeAll(() => {
  notifyManager.setNotifyFunction((fn) => {
    act(fn);
  });
});

afterAll(() => {
  notifyManager.setNotifyFunction((fn) => fn());
});

afterEach(() => {
  cleanup();
});
