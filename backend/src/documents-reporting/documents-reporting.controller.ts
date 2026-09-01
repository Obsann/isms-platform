import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../common';
import type { Transaction } from '../types';
import { DocumentsReportingService } from './documents-reporting.service';

@Controller('reports')
export class DocumentsReportingController {
  constructor(private readonly reportingService: DocumentsReportingService) {}

  @Get('savings-summary')
  @Roles('tenant-admin', 'super-admin', 'loan-officer')
  getSavingsSummary() {
    return this.reportingService.getSavingsSummary();
  }

  @Get('loan-portfolio')
  @Roles('tenant-admin', 'super-admin', 'loan-officer')
  getLoanPortfolio() {
    return this.reportingService.getLoanPortfolio();
  }

  @Get('trial-balance')
  @Roles('tenant-admin', 'super-admin', 'loan-officer')
  getTrialBalance() {
    return this.reportingService.getTrialBalance();
  }

  @Get('recent-transactions')
  @Roles('tenant-admin', 'super-admin', 'loan-officer', 'teller')
  getRecentTransactions(
    @Query('limit') limit?: string,
  ): Promise<Transaction[]> {
    const parsed = limit ? Number.parseInt(limit, 10) : 8;
    return this.reportingService.getRecentTransactions(
      Number.isFinite(parsed) ? parsed : 8,
    );
  }

  @Get('members/:id/statement')
  @Roles('tenant-admin', 'super-admin', 'teller', 'loan-officer')
  async getMemberStatement(
    @Param('id') memberId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const doc = await this.reportingService.generateMemberStatement({
      memberId,
      from,
      to,
    });
    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(doc.content);
  }

  @Get('loans/:id/agreement')
  @Roles('tenant-admin', 'super-admin', 'teller', 'loan-officer')
  async getLoanAgreement(@Param('id') loanId: string, @Res() res: Response) {
    const doc = await this.reportingService.generateLoanAgreement({ loanId });
    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(doc.content);
  }

  @Get('transactions/:id/receipt')
  @Roles('tenant-admin', 'super-admin', 'teller', 'loan-officer')
  async getReceipt(@Param('id') transactionId: string, @Res() res: Response) {
    const doc = await this.reportingService.generateReceipt({ transactionId });
    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(doc.content);
  }

  @Get('members/:id/share-certificate')
  @Roles('tenant-admin', 'super-admin', 'teller', 'loan-officer')
  async getShareCertificate(@Param('id') memberId: string, @Res() res: Response) {
    const doc = await this.reportingService.generateShareCertificate({ memberId });
    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(doc.content);
  }
}
