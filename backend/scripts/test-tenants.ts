import { TenantEntity } from '../src/tenants/tenant.entity';
import { TenantsService } from '../src/tenants/tenants.service';

class FakeRepo {
  items: any[] = [];
  async find() {
    return this.items;
  }
  create(obj: any) {
    return { ...obj, id: (Math.random() + '').slice(2), createdAt: new Date(), updatedAt: new Date() };
  }
  async save(ent: any) {
    this.items.unshift(ent);
    return ent;
  }
  async findOneBy(cond: any) {
    return this.items.find((it) => it.id === cond.id) ?? null;
  }
  async delete(cond: any) {
    this.items = this.items.filter((it) => it.id !== cond.id);
  }
}

async function run() {
  const repo = new FakeRepo();
  const ds = { getRepository: () => repo } as any;
  const svc = new TenantsService(ds);

  console.log('Initial list:');
  console.log(await svc.list());

  console.log('Creating tenant...');
  const created = await svc.create({ name: 'Test SACCO', code: 'test-sacco' });
  console.log('Created:', created);

  console.log('List after create:');
  console.log(await svc.list());
}

run().catch((err) => {
  console.error('Test failed', err);
  process.exit(1);
});
