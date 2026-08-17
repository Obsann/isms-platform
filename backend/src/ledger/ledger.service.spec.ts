/// <reference types="jest" />
import { UnprocessableEntityException } from '@nestjs/common';
import { assertBalanced, LedgerService } from './ledger.service';
import { GL, type LedgerLine } from './ledger.types';

describe('assertBalanced', () => {
  it('accepts a matching debit/credit pair', () => {
    const lines: LedgerLine[] = [
      { glCode: GL.CASH, side: 'debit', amount: '100.50' },
      { glCode: GL.MEMBER_SAVINGS, side: 'credit', amount: '100.50' },
    ];
    expect(() => assertBalanced(lines)).not.toThrow();
  });

  it('rejects an unbalanced pair before any persistence can run', () => {
    const lines: LedgerLine[] = [
      { glCode: GL.CASH, side: 'debit', amount: '100.00' },
      { glCode: GL.MEMBER_SAVINGS, side: 'credit', amount: '99.99' },
    ];
    expect(() => assertBalanced(lines)).toThrow(UnprocessableEntityException);
    expect(() => assertBalanced(lines)).toThrow(/Unbalanced posting rejected/);
  });

  it('rejects a single-sided posting', () => {
    expect(() =>
      assertBalanced([{ glCode: GL.CASH, side: 'debit', amount: '10.00' }]),
    ).toThrow(UnprocessableEntityException);
  });
});

describe('LedgerService.postLines', () => {
  it('does not write when the posting is unbalanced', async () => {
    const save = jest.fn();
    const query = jest.fn();
    const service = new LedgerService({
      getTenantId: () => 'tenant-1',
      repo: () => ({ create: (row: unknown): unknown => row, save }),
      getManager: () => ({ query }),
    } as never);

    await expect(
      service.postLines(
        [
          { glCode: GL.CASH, side: 'debit', amount: '10.00' },
          { glCode: GL.MEMBER_SAVINGS, side: 'credit', amount: '1.00' },
        ],
        { type: 'deposit' },
      ),
    ).rejects.toThrow(UnprocessableEntityException);

    expect(save).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });
});
