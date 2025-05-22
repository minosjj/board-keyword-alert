import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { KeywordAlertService } from 'src/alerts/keyword-alert.service';
import { PostsService } from 'src/posts/posts.service';
import { PostsRepository } from 'src/posts/posts.repository';
import { Post } from 'src/posts/entities/post.entity';

describe('PostsService', () => {
  let service: PostsService;
  let postsRepository: jest.Mocked<PostsRepository>;
  let keywordAlertService: jest.Mocked<KeywordAlertService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostsRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findWithQuery: jest.fn(),
            findById: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: KeywordAlertService,
          useValue: {
            checkAndSendAlerts: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PostsService);
    postsRepository = module.get(PostsRepository);
    keywordAlertService = module.get(KeywordAlertService);
  });

  it('should save and return a post', async () => {
    const dto = { title: 'Hello', content: 'World', author: 'Jane', password: 'pw' };
    const saved: Post = { id: 1, ...dto };

    postsRepository.create.mockReturnValue(saved);
    postsRepository.save.mockResolvedValue(saved);

    const result = await service.create(dto);

    expect(result).toEqual(saved);
    expect(postsRepository.save).toHaveBeenCalledWith(saved);
  });

  it('should call keywordAlertService.checkAndSendAlerts after create', async () => {
    const dto = { title: 'Alert', content: 'This is an alert', author: 'Bob', password: 'pw' };
    const saved: Post = { id: 1, ...dto };
    postsRepository.create.mockReturnValue(saved);
    postsRepository.save.mockResolvedValue(saved);

    await service.create(dto);

    expect(keywordAlertService.checkAndSendAlerts).toHaveBeenCalledWith(
      saved.content,
      saved.author,
    );
  });

  it('should return paginated posts', async () => {
    postsRepository.findWithQuery.mockResolvedValue([[{ id: 1 } as Post], 1]);
    const result = await service.readPosts({ page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.items.length).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should filter posts by title/author', async () => {
    postsRepository.findWithQuery.mockResolvedValue([
      [{ id: 2, title: 'Nest', author: 'Alice' } as Post],
      1,
    ]);
    const result = await service.readPosts({ page: 1, limit: 10, title: 'Nest', author: 'Alice' });

    expect(result.items[0].title).toBe('Nest');
    expect(result.items[0].author).toBe('Alice');
  });

  it('should update post if password matches', async () => {
    const post: Post = { id: 1, title: 'Old', content: 'Old', author: 'Jane', password: 'pw' };
    postsRepository.findById.mockResolvedValue(post);
    postsRepository.save.mockResolvedValue({ ...post, title: 'New', content: 'New' });

    const dto = { title: 'New', content: 'New', password: 'pw' };
    const result = await service.update(1, dto);

    expect(result.title).toBe('New');
    expect(result.content).toBe('New');
  });

  it('should call keywordAlertService.checkAndSendAlerts after update', async () => {
    const post: Post = { id: 1, title: 'Old', content: 'Old', author: 'Jane', password: 'pw' };
    postsRepository.findById.mockResolvedValue(post);
    postsRepository.save.mockResolvedValue({ ...post, title: 'Update', content: 'Alert' });

    const dto = { title: 'Update', content: 'Alert', password: 'pw' };
    await service.update(1, dto);

    expect(keywordAlertService.checkAndSendAlerts).toHaveBeenCalledWith('Alert', 'Jane');
  });

  it('should throw ForbiddenException if password does not match on update', async () => {
    const post: Post = { id: 1, title: '', content: '', author: 'Jane', password: 'rightpw' };
    postsRepository.findById.mockResolvedValue(post);

    await expect(
      service.update(1, { title: '', content: '', password: 'wrongpw' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if post not found on update', async () => {
    postsRepository.findById.mockResolvedValue(null);

    await expect(service.update(99, { title: '', content: '', password: 'pw' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete post if password matches', async () => {
    const post: Post = { id: 1, title: '', content: '', author: '', password: 'pw' };
    postsRepository.findById.mockResolvedValue(post);
    postsRepository.remove.mockResolvedValue(post);

    await expect(service.delete(1, { password: 'pw' })).resolves.toBeUndefined();
    expect(postsRepository.remove).toHaveBeenCalledWith(post);
  });

  it('should throw ForbiddenException if password does not match on delete', async () => {
    const post: Post = { id: 1, title: '', content: '', author: '', password: 'rightpw' };
    postsRepository.findById.mockResolvedValue(post);

    await expect(service.delete(1, { password: 'wrongpw' })).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if post not found on delete', async () => {
    postsRepository.findById.mockResolvedValue(null);

    await expect(service.delete(1, { password: 'pw' })).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if password does not match in assertPasswordValid', () => {
    const post: Post = { id: 1, title: '', content: '', author: '', password: 'pw' };

    expect(() => service['assertPasswordValid'](post, 'wrongpw')).toThrow(ForbiddenException);
  });
});
