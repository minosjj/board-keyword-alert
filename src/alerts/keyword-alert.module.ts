import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeywordAlert } from 'src/alerts/entities/keyword_alert.entity';
import { KeywordAlertRepository } from 'src/alerts/keyword-alert.repository';
import { KeywordAlertService } from 'src/alerts/keyword-alert.service';

@Module({
  imports: [TypeOrmModule.forFeature([KeywordAlert])],
  providers: [KeywordAlertRepository, KeywordAlertService],
  exports: [KeywordAlertService],
})
export class KeywordAlertModule {}
