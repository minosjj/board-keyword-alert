import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PostsRepository } from 'src/posts/posts.repository';
import { KeywordAlertService } from 'src/alerts/keyword-alert.service';
import { Post } from 'src/posts/entities/post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { CommentsService } from 'src/comments/comments.service';
import { CommentsRepository } from 'src/comments/comments.repository';

function mockPost(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    title: 'Mock Title',
    content: 'Mock Content',
    author: 'Mock Author',
    password: '1234',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    content: 'Mock Content',
    author: 'Mock Author',
    postId: 1,
    post: mockPost({ id: 1 }),
    createdAt: new Date(),
    ...overrides,
  };
}

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepo: jest.Mocked<CommentsRepository>;
  let postsRepo: jest.Mocked<PostsRepository>;
  let keywordAlertService: jest.Mocked<KeywordAlertService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: CommentsRepository,
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findByPostId: jest.fn(),
            softRemove: jest.fn(),
          },
        },
        {
          provide: PostsRepository,
          useValue: {
            findById: jest.fn(),
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

    service = module.get(CommentsService);
    commentsRepo = module.get(CommentsRepository);
    postsRepo = module.get(PostsRepository);
    keywordAlertService = module.get(KeywordAlertService);
  });

  it('should create a comment when post exists', async () => {
    postsRepo.findById.mockResolvedValue(mockPost({ id: 1 }));
    commentsRepo.create.mockReturnValue(
      mockComment({ id: 100, content: 'hi', author: 'Tom', postId: 1 }),
    );
    commentsRepo.save.mockResolvedValue(
      mockComment({ id: 100, content: 'hi', author: 'Tom', postId: 1 }),
    );

    const result = await service.create(1, { content: 'hi', author: 'Tom' });

    expect(result.id).toBe(100);
    expect(commentsRepo.save).toHaveBeenCalled();
  });

  it('should create a nested comment if parent exists and postId matches', async () => {
    postsRepo.findById.mockResolvedValue(mockPost({ id: 1 }));
    commentsRepo.findById.mockResolvedValue(mockComment({ id: 10, postId: 1 }));
    commentsRepo.create.mockReturnValue(
      mockComment({
        id: 101,
        content: 'reply',
        author: 'Jane',
        postId: 1,
        parentCommentId: 10,
      }),
    );
    commentsRepo.save.mockResolvedValue(
      mockComment({
        id: 101,
        content: 'reply',
        author: 'Jane',
        postId: 1,
        parentCommentId: 10,
      }),
    );

    const result = await service.create(1, {
      content: 'reply',
      author: 'Jane',
      parentCommentId: 10,
    });

    expect(result.parentCommentId).toBe(10);
    expect(commentsRepo.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if post not found', async () => {
    postsRepo.findById.mockResolvedValue(null);

    await expect(service.create(2, { content: 'hi', author: 'Jane' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if parent comment not found or postId mismatched', async () => {
    postsRepo.findById.mockResolvedValue(mockPost({ id: 1 }));
    commentsRepo.findById.mockResolvedValue(mockComment({ id: 99, postId: 99 }));

    await expect(
      service.create(1, { content: 'reply', author: 'Jane', parentCommentId: 99 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should call keywordAlertService.checkAndSendAlerts after create', async () => {
    postsRepo.findById.mockResolvedValue(mockPost({ id: 1 }));
    commentsRepo.create.mockReturnValue(
      mockComment({ id: 120, content: 'alert', author: 'Sam', postId: 1 }),
    );
    commentsRepo.save.mockResolvedValue(
      mockComment({ id: 120, content: 'alert', author: 'Sam', postId: 1 }),
    );

    await service.create(1, { content: 'alert', author: 'Sam' });

    expect(keywordAlertService.checkAndSendAlerts).toHaveBeenCalledWith('alert', 'Sam');
  });

  it('should return paginated comments', async () => {
    commentsRepo.findByPostId.mockResolvedValue([
      [mockComment({ id: 1, content: 'hi', author: 'Jane', postId: 1, createdAt: new Date() })],
      1,
    ]);

    const result = await service.readCommentsByPost(1, { page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.items.length).toBe(1);
  });

  it('should return nested comments structure', async () => {
    const now = new Date();
    const comments: Comment[] = [
      mockComment({ id: 1, content: 'parent', author: 'A', postId: 1, createdAt: now }),
      mockComment({
        id: 2,
        content: 'child',
        author: 'B',
        postId: 1,
        createdAt: now,
        parentCommentId: 1,
      }),
    ];
    commentsRepo.findByPostId.mockResolvedValue([comments, 2]);

    const result = await service.readCommentsByPost(1, { page: 1, limit: 10 });

    expect(result.items.length).toBe(1);
    expect(result.items[0].children.length).toBe(1);
    expect(result.items[0].children[0].parentCommentId).toBe(1);
  });

  it('should softRemove comment if ids match', async () => {
    commentsRepo.findById.mockResolvedValue(mockComment({ id: 99, postId: 1 }));
    commentsRepo.softRemove.mockResolvedValue(undefined);

    await expect(service.delete(1, 99)).resolves.toBeUndefined();
    expect(commentsRepo.softRemove).toHaveBeenCalled();
  });

  it('should throw NotFoundException if comment not found or postId mismatch', async () => {
    commentsRepo.findById.mockResolvedValue(null);

    await expect(service.delete(1, 123)).rejects.toThrow(NotFoundException);
  });
});
