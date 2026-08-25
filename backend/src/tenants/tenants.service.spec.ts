import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let mockRepo: any;
  let mockDataSource: any;

  const sampleTenant = {
    id: 't-123',
    name: 'Addis Ababa Sacco',
    code: 'AA-SACCO',
    status: 'active',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn().mockResolvedValue([sampleTenant]),
      findOneBy: jest.fn().mockResolvedValue(sampleTenant),
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        id: 't-456',
        createdAt: new Date('2024-01-02T00:00:00Z'),
      })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
      query: jest.fn().mockResolvedValue([{ id: 't-123', status: 'active' }]),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should resolve active tenant by code', async () => {
    const result = await service.resolveActiveByCode('AA-SACCO');
    expect(result).toEqual({ id: 't-123', status: 'active' });
    expect(mockDataSource.query).toHaveBeenCalledWith(
      'SELECT * FROM resolve_tenant_by_code($1)',
      ['AA-SACCO'],
    );
  });

  it('should list tenants', async () => {
    const result = await service.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Addis Ababa Sacco');
  });

  it('should create a new tenant', async () => {
    const dto = { name: 'Hawassa Sacco', code: 'HW-SACCO', status: 'active' as const };
    const result = await service.create(dto);
    expect(result.name).toBe('Hawassa Sacco');
    expect(result.id).toBe('t-456');
  });

  it('should update tenant status', async () => {
    const result = await service.update('t-123', { status: 'suspended' });
    expect(result?.status).toBe('suspended');
  });

  it('should remove tenant', async () => {
    await service.remove('t-123');
    expect(mockRepo.delete).toHaveBeenCalledWith({ id: 't-123' });
  });
});
