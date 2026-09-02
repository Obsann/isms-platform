import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public, Roles, type AuthenticatedUser } from '../common';
import { ChapaService, type ChapaCheckoutMode, type ChapaInitializeResult, type ChapaPaymentView } from './chapa.service';
import { InitializeChapaDepositDto } from './dto/initialize-chapa-deposit.dto';
import { readSignatureHeader } from './chapa.helpers';

@Controller('channel/chapa')
export class ChapaController {
  constructor(private readonly chapa: ChapaService) {}

  @Get('status')
  @Roles('member')
  status(): { mode: ChapaCheckoutMode } {
    return { mode: this.chapa.getMode() };
  }

  @Post('deposits/initialize')
  @Roles('member')
  initialize(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitializeChapaDepositDto,
  ): Promise<ChapaInitializeResult> {
    return this.chapa.initializeDeposit(user, dto);
  }

  @Get('deposits/:txRef')
  @Roles('member')
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param('txRef') txRef: string,
  ): Promise<ChapaPaymentView> {
    return this.chapa.verifyDeposit(user, txRef);
  }

  @Post('deposits/:txRef/mock-complete')
  @Roles('member')
  confirmMock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('txRef') txRef: string,
  ): Promise<ChapaPaymentView> {
    return this.chapa.confirmMockDeposit(user, txRef);
  }
}

@Controller('webhooks')
export class ChapaWebhookController {
  constructor(private readonly chapa: ChapaService) {}

  /**
   * Chapa C2B callback. `@Public()` because Chapa has no JWT; HMAC is the auth.
   * Unsigned `status` in the body is never trusted — we re-verify with Chapa
   * (or the mock-confirmed flag) before posting the ledger.
   */
  @Post('chapa')
  @Public()
  @HttpCode(200)
  handle(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ status: 'RECEIVED'; eventId: string; processedAt: string }> {
    const headers = req.headers as Record<string, string | string[] | undefined>;
    return this.chapa.handleWebhook({
      rawBody: req.rawBody,
      signature: readSignatureHeader(headers),
      body: req.body,
    });
  }
}
