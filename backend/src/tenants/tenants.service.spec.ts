import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantEntity } from './tenant.entity';
import { ConflictException } from '@nestjs/common';

describe('TenantsService (Platform Level)', () => {
  let service: TenantsService;
  let mockRepository: any;
  let mockDataSource: any;

  const mockTenantEntity: Partial<TenantEntity> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Oromia Teachers SACCO',
    code: 'oromia-teachers',
    status: 'active',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn().mockResolvedValue([mockTenantEntity]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: mockTenantEntity.id, createdAt: mockTenantEntity.createdAt })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
  });

  it('should list all tenants ordered by createdAt DESC', async () => {
    const list = await service.list();
    expect(list).toHaveLength(1);
    expect(list[0].code).toBe('oromia-teachers');
    expect(mockRepository.find).toHaveBeenCalledWith({ where: {}, order: { createdAt: 'DESC' } });
  });

  it('should create a new tenant with sanitized code', async () => {
    const payload = { name: '  Oromia Teachers SACCO  ', code: '  OROMIA-TEACHERS  ' };
    const created = await service.create(payload);

    expect(created.name).toBe('Oromia Teachers SACCO');
    expect(created.code).toBe('oromia-teachers');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should throw ConflictException if tenant code already exists', async () => {
    mockRepository.findOneBy.mockResolvedValueOnce(mockTenantEntity);

    await expect(
      service.create({ name: 'Duplicate SACCO', code: 'oromia-teachers' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should update tenant details', async () => {
    mockRepository.findOneBy.mockResolvedValueOnce(mockTenantEntity);

    const updated = await service.update(mockTenantEntity.id!, { status: 'suspended' });
    expect(updated?.status).toBe('suspended');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should return null when updating non-existent tenant', async () => {
    mockRepository.findOneBy.mockResolvedValueOnce(null);
    const result = await service.update('missing-id', { status: 'suspended' });
    expect(result).toBeNull();
  });

  it('should delete a tenant by id', async () => {
    await service.remove(mockTenantEntity.id!);
    expect(mockRepository.delete).toHaveBeenCalledWith({ id: mockTenantEntity.id });
  });
});
