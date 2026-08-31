/// <reference types="jest" />
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  it('records actor, action, entity, and tenant on the scoped repository', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const create = jest.fn((row: unknown) => row);
    const service = new AuditLogService({
      getTenantId: () => 'tenant-1',
      repo: () => ({ create, save }),
    } as never);

    await service.record({
      actorStaffId: 'staff-1',
      action: 'POST /members',
      entity: 'members',
      entityId: 'member-1',
      after: { id: 'member-1' },
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        actorStaffId: 'staff-1',
        action: 'POST /members',
        entity: 'members',
        entityId: 'member-1',
        after: { id: 'member-1' },
      }),
    );
    expect(save).toHaveBeenCalled();
  });

  it('does not expose an update or delete method', () => {
    const service = new AuditLogService({} as never);
    expect(service).not.toHaveProperty('update');
    expect(service).not.toHaveProperty('delete');
    expect(service).not.toHaveProperty('remove');
  });
});
