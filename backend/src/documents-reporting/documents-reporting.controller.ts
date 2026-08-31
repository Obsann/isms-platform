import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DocumentsReportingService } from './documents-reporting.service';
import { Roles } from '../common';

@Controller('reports')
@Roles('tenant-admin', 'super-admin')
export class DocumentsReportingController {
  constructor(private readonly reportingService: DocumentsReportingService) {}

  @Get('savings-summary')
  async getSavingsSummary() {
    return this.reportingService.getSavingsSummary();
  }

  @Get('loan-portfolio')
  async getLoanPortfolio() {
    return this.reportingService.getLoanPortfolio();
  }

  @Get('trial-balance')
  async getTrialBalance() {
    return this.reportingService.getTrialBalance();
  }

  @Get('members/:id/statement')
  async getMemberStatement(
    @Param('id') memberId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const doc = await this.reportingService.generateMemberStatement({ memberId, from, to });
    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(doc.content);
  }

  @Get('loans/:id/agreement')
  async getLoanAgreement(@Param('id') loanId: string, @Res() res: Response) {
    const doc = await this.reportingService.generateLoanAgreement({ loanId });
    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(doc.content);
  }

  @Get('transactions/:id/receipt')
  async getReceipt(@Param('id') transactionId: string, @Res() res: Response) {
    const doc = await this.reportingService.generateReceipt({ transactionId });
    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(doc.content);
  }

  @Get('members/:id/share-certificate')
  async getShareCertificate(@Param('id') memberId: string, @Res() res: Response) {
    const doc = await this.reportingService.generateShareCertificate({ memberId });
    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    return res.send(doc.content);
  }
}
