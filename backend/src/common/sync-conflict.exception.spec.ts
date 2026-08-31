/// <reference types="jest" />
import { SyncConflictException } from '../common/sync-conflict.exception';

describe('SyncConflictException', () => {
  it('uses the SyncConflict error code for offline review routing', () => {
    const ex = new SyncConflictException();
    const body = ex.getResponse() as { error: string; statusCode: number };
    expect(body.error).toBe('SyncConflict');
    expect(body.statusCode).toBe(409);
  });
});
