import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CommentsService } from 'src/comments/comments.service';
import { KeywordAlertService } from 'src/alerts/keyword-alert.service';
import { CommentsRepository } from 'src/comments/comments.repository';
import { PostsRepository } from 'src/posts/posts.repository';
import { Comment } from 'src/comments/entities/comment.entity';
import { Post } from 'src/posts/entities/post.entity';
import { CreateCommentDto } from 'src/comments/dto/create-comment.dto';

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

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepo: jest.Mocked<CommentsRepository>;
  let postsRepo: jest.Mocked<PostsRepository>;
  let alertService: jest.Mocked<KeywordAlertService>;

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
            softRemove: jest.fn(),
            findByPostId: jest.fn(),
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
    alertService = module.get(KeywordAlertService);
  });

  it('should create a comment and trigger keyword alert', async () => {
    const postId = 1;
    const dto: CreateCommentDto = {
      content: '오늘 병원 갔어요',
      author: 'Bob',
    };
    const post = mockPost({ id: postId });
    const comment: Comment = {
      id: 1,
      postId,
      content: dto.content,
      author: dto.author,
      createdAt: new Date(),
      parentCommentId: null,
    } as Comment;

    postsRepo.findById.mockResolvedValue(post);
    commentsRepo.create.mockReturnValue(comment);
    commentsRepo.save.mockResolvedValue(comment);

    const result = await service.create(postId, dto);

    expect(result).toEqual(comment);
    expect(commentsRepo.create).toHaveBeenCalledWith({
      postId,
      content: dto.content,
      author: dto.author,
      parentCommentId: null,
    });
    expect(alertService.checkAndSendAlerts).toHaveBeenCalledWith(dto.content, dto.author);
  });

  it('should throw if post does not exist', async () => {
    postsRepo.findById.mockResolvedValue(null);

    await expect(service.create(1, { content: 'hi', author: 'A' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw if parent comment does not exist or mismatched', async () => {
    const postId = 1;
    postsRepo.findById.mockResolvedValue(mockPost({ id: postId }));
    commentsRepo.findById.mockResolvedValue({ id: 999, postId: 999 } as Comment);

    await expect(
      service.create(postId, {
        content: 'child',
        author: 'B',
        parentCommentId: 999,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should delete comment if it exists and matches postId', async () => {
    const comment: Comment = { id: 1, postId: 2 } as Comment;
    commentsRepo.findById.mockResolvedValue(comment);
    commentsRepo.softRemove.mockResolvedValue(undefined);

    await service.delete(2, 1);
    expect(commentsRepo.softRemove).toHaveBeenCalledWith(comment);
  });

  it('should throw if comment not found or postId mismatch', async () => {
    commentsRepo.findById.mockResolvedValue(null);
    await expect(service.delete(1, 1)).rejects.toThrow(NotFoundException);

    commentsRepo.findById.mockResolvedValue({ id: 1, postId: 99 } as Comment);
    await expect(service.delete(1, 1)).rejects.toThrow(NotFoundException);
  });

  it('should return nested comments with pagination', async () => {
    const postId = 1;
    const parentComment: Comment = {
      id: 1,
      postId,
      content: '부모 댓글',
      author: 'Author1',
      createdAt: new Date(),
      parentCommentId: null,
    } as Comment;

    const childComment: Comment = {
      id: 2,
      postId,
      content: '대댓글',
      author: 'Author2',
      createdAt: new Date(),
      parentCommentId: 1,
    } as Comment;

    commentsRepo.findByPostId.mockResolvedValue([[parentComment, childComment], 2]);

    const result = await service.readCommentsByPost(postId, { page: 1, limit: 10 });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.items.length).toBe(1);
    expect(result.items[0].id).toBe(1);
    expect(result.items[0].children.length).toBe(1);
    expect(result.items[0].children[0].parentCommentId).toBe(1);
  });
});
