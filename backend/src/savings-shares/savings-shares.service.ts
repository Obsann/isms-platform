import { Injectable, NotImplementedException } from '@nestjs/common';
import type { AccountId, MemberId, Transaction } from '../types';
import type {
  AccountBalance,
  DepositInput,
  FundsHold,
  HoldFundsInput,
  LoanEligibilityCeiling,
  SharePurchaseInput,
  WithdrawalInput,
} from './savings-shares.types';

/**
 * Savings & Shares vertical — owner: **Jerry** (Task 12).
 *
 * Every method that moves money posts through the ledger service (Task 13),
 * injected by DI. Nothing in this module writes a balance column directly.
 */
@Injectable()
export class SavingsSharesService {
  deposit(input: DepositInput): Promise<Transaction> {
    throw new NotImplementedException('SavingsSharesService.deposit is not implemented (Task 12)');
  }

  withdraw(input: WithdrawalInput): Promise<Transaction> {
    throw new NotImplementedException('SavingsSharesService.withdraw is not implemented (Task 12)');
  }

  purchaseShares(input: SharePurchaseInput): Promise<Transaction> {
    throw new NotImplementedException(
      'SavingsSharesService.purchaseShares is not implemented (Task 12)',
    );
  }

  /** Held amounts are excluded from `availableBalance`, never from `balance`. */
  getBalance(accountId: AccountId): Promise<AccountBalance> {
    throw new NotImplementedException(
      'SavingsSharesService.getBalance is not implemented (Task 12)',
    );
  }

  /** Used by the Loans vertical when a guarantor pledges savings (Task 17). */
  holdFunds(input: HoldFundsInput): Promise<FundsHold> {
    throw new NotImplementedException(
      'SavingsSharesService.holdFunds is not implemented (Task 12)',
    );
  }

  releaseHold(holdId: string): Promise<FundsHold> {
    throw new NotImplementedException(
      'SavingsSharesService.releaseHold is not implemented (Task 12)',
    );
  }

  getLoanEligibilityCeiling(memberId: MemberId): Promise<LoanEligibilityCeiling> {
    throw new NotImplementedException(
      'SavingsSharesService.getLoanEligibilityCeiling is not implemented (Task 12)',
    );
  }
}
