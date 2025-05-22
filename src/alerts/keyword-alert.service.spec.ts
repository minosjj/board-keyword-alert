import { KeywordAlertRepository } from 'src/alerts/keyword-alert.repository';
import { KeywordAlertService } from 'src/alerts/keyword-alert.service';

describe('KeywordAlertService', () => {
  let service: KeywordAlertService;
  let repo: jest.Mocked<KeywordAlertRepository>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
    } as any;

    service = new KeywordAlertService(repo);
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should send alert if keyword is included and author is not owner', async () => {
    repo.findAll.mockResolvedValue([{ id: 1, owner: 'Alice', keyword: 'dog' }]);

    await service.checkAndSendAlerts('I love dog', 'Bob');
    expect(console.log).toHaveBeenCalledWith(service['formatNotification']('Alice', 'dog'));
  });

  it('should NOT send alert if author is owner', async () => {
    repo.findAll.mockResolvedValue([{ id: 1, owner: 'Alice', keyword: 'cat' }]);
    await service.checkAndSendAlerts('I love cat', 'Alice');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should NOT send alert if keyword not included', async () => {
    repo.findAll.mockResolvedValue([{ id: 1, owner: 'Alice', keyword: 'bird' }]);
    await service.checkAndSendAlerts('I love dog', 'Bob');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should send multiple alerts if multiple keywords match', async () => {
    repo.findAll.mockResolvedValue([
      { id: 1, owner: 'Alice', keyword: 'dog' },
      { id: 2, owner: 'Tom', keyword: 'cat' },
    ]);
    await service.checkAndSendAlerts('cat and dog', 'Sam');
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(service['formatNotification']('Alice', 'dog'));
    expect(console.log).toHaveBeenCalledWith(service['formatNotification']('Tom', 'cat'));
  });

  it('should format alert message as specified', () => {
    const msg = (service as any).formatNotification('Alice', 'dog');
    expect(msg).toBe(
      `[Alert] A post or comment containing your keyword "dog" has been created, Alice.`,
    );
  });
});
