import { Body, Controller, Get, Param, Post, Query, Req, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import type { Account, Transaction } from '../types';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { PurchaseSharesDto } from './dto/purchase-shares.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { SavingsSharesService } from './savings-shares.service';
import type { AccountBalance } from './savings-shares.types';

@Controller('accounts')
export class SavingsSharesController {
  constructor(private readonly savingsSharesService: SavingsSharesService) {}

  @Post()
  @Roles('teller', 'tenant-admin', 'loan-officer')
  createAccount(@Body() dto: CreateAccountDto): Promise<Account> {
    return this.savingsSharesService.createAccount(dto);
  }

  @Get()
  @Roles('teller', 'tenant-admin', 'loan-officer')
  listByMember(@Query('memberId') memberId?: string): Promise<Account[]> {
    if (!memberId) {
      throw new BadRequestException('memberId query parameter is required');
    }
    return this.savingsSharesService.getAccountsByMember(memberId);
  }

  @Get(':id')
  @Roles('teller', 'tenant-admin', 'member')
  getBalance(@Param('id') id: string): Promise<AccountBalance> {
    return this.savingsSharesService.getBalance(id);
  }

  @Post(':id/deposits')
  @Roles('teller', 'tenant-admin')
  deposit(
    @Param('id') id: string,
    @Body() dto: DepositDto,
    @Req() req: Request & { user?: AuthenticatedUser },
  ): Promise<Transaction> {
    return this.savingsSharesService.deposit({
      accountId: id,
      amount: dto.amount,
      reference: dto.reference,
      narration: dto.narration,
      postedByStaffId: req.user?.staffId,
    });
  }

  @Post(':id/withdrawals')
  @Roles('teller', 'tenant-admin')
  withdraw(
    @Param('id') id: string,
    @Body() dto: WithdrawDto,
    @Req() req: Request & { user?: AuthenticatedUser },
  ): Promise<Transaction> {
    return this.savingsSharesService.withdraw({
      accountId: id,
      amount: dto.amount,
      reference: dto.reference,
      narration: dto.narration,
      postedByStaffId: req.user?.staffId,
    });
  }

  @Post(':id/share-purchases')
  @Roles('teller', 'tenant-admin')
  purchaseShares(
    @Param('id') id: string,
    @Body() dto: PurchaseSharesDto,
    @Req() req: Request & { user?: AuthenticatedUser },
  ): Promise<Transaction> {
    return this.savingsSharesService.purchaseShares({
      memberId: dto.memberId,
      shareCount: dto.shareCount,
      amount: dto.amount,
      reference: dto.reference,
      postedByStaffId: req.user?.staffId,
    });
  }
}
