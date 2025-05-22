import { Injectable } from '@nestjs/common';
import { KeywordAlert } from 'src/alerts/entities/keyword_alert.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class KeywordAlertRepository extends Repository<KeywordAlert> {
  constructor(private dataSource: DataSource) {
    super(KeywordAlert, dataSource.createEntityManager());
  }

  async findAll(): Promise<KeywordAlert[]> {
    return this.find();
  }
}
