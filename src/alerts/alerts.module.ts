import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeywordAlert } from 'src/alerts/entities/keyword_alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KeywordAlert])],
  controllers: [],
  providers: [],
})
export class AlertsModule {}
