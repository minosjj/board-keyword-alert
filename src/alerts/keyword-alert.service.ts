import { Injectable } from '@nestjs/common';
import { KeywordAlertRepository } from 'src/alerts/keyword-alert.repository';

@Injectable()
export class KeywordAlertService {
  constructor(private readonly keywordRepo: KeywordAlertRepository) {}

  async checkAndSendAlerts(text: string, author: string): Promise<void> {
    const alerts = await this.keywordRepo.findAll();
    alerts
      .filter((alert) => alert.owner !== author && text.includes(alert.keyword))
      .forEach((alert) => this.sendNotification(alert.owner, alert.keyword));
  }

  private sendNotification(name: string, keyword: string): void {
    console.log(this.formatNotification(name, keyword));
  }

  private formatNotification(owner: string, keyword: string): string {
    return `[Alert] A post or comment containing your keyword "${keyword}" has been created, ${owner}.`;
  }
}
