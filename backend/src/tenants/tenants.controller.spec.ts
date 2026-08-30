import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { NotFoundException } from '@nestjs/common';

describe('TenantsController (Platform Level)', () => {
  let controller: TenantsController;
  let service: jest.Mocked<TenantsService>;

  const mockTenant = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Addis Ababa SACCO',
    code: 'addis-sacco',
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockService = {
      list: jest.fn().mockResolvedValue([mockTenant]),
      create: jest.fn().mockResolvedValue(mockTenant),
      get: jest.fn().mockResolvedValue(mockTenant),
      update: jest.fn().mockResolvedValue(mockTenant),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    service = module.get(TenantsService);
  });

  it('should list tenants', async () => {
    const result = await controller.list();
    expect(result).toEqual([mockTenant]);
    expect(service.list).toHaveBeenCalled();
  });

  it('should provision/create a new tenant', async () => {
    const dto = { name: 'Addis Ababa SACCO', code: 'addis-sacco' };
    const result = await controller.create(dto);
    expect(result).toEqual(mockTenant);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should get tenant by id', async () => {
    const result = await controller.get(mockTenant.id);
    expect(result).toEqual(mockTenant);
    expect(service.get).toHaveBeenCalledWith(mockTenant.id);
  });

  it('should throw NotFoundException when tenant is not found', async () => {
    service.get.mockResolvedValueOnce(null);
    await expect(controller.get('non-existent-id')).rejects.toThrow(NotFoundException);
  });

  it('should update tenant', async () => {
    const updateDto = { status: 'suspended' as const };
    const updated = { ...mockTenant, status: 'suspended' as const };
    service.update.mockResolvedValueOnce(updated);

    const result = await controller.update(mockTenant.id, updateDto);
    expect(result).toEqual(updated);
    expect(service.update).toHaveBeenCalledWith(mockTenant.id, updateDto);
  });

  it('should remove tenant', async () => {
    await controller.remove(mockTenant.id);
    expect(service.remove).toHaveBeenCalledWith(mockTenant.id);
  });
});
