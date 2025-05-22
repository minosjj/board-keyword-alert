import { BadRequestException, Injectable, Logger, NotFoundException, Post } from '@nestjs/common';
import { KeywordAlertService } from 'src/alerts/keyword-alert.service';
import { CommentsRepository } from 'src/comments/comments.repository';
import { CreateCommentDto } from 'src/comments/dto/create-comment.dto';
import { NestedCommentDto } from 'src/comments/dto/nested-comment.dto';
import { Comment } from 'src/comments/entities/comment.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { PostsRepository } from 'src/posts/posts.repository';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly commentsRepo: CommentsRepository,
    private readonly postsRepo: PostsRepository,
    private readonly keywordAlertService: KeywordAlertService,
  ) {}

  async create(postId: number, dto: CreateCommentDto): Promise<Comment> {
    const post = await this.postsRepo.findById(postId);
    if (!post) {
      this.logger.warn(`Post not found (id=${postId})`);
      throw new NotFoundException('Post not found');
    }

    if (dto.parentCommentId) {
      const parent = await this.commentsRepo.findById(dto.parentCommentId);
      if (!parent || parent.postId !== postId) {
        this.logger.warn(
          `Parent comment not found or mismatched (parentId=${dto.parentCommentId}, postId=${postId})`,
        );
        throw new BadRequestException('Parent comment not found or mismatched');
      }
    }

    const comment: Comment = this.commentsRepo.create({
      postId,
      content: dto.content,
      author: dto.author,
      parentCommentId: dto.parentCommentId ?? null,
    });
    const saved: Comment = await this.commentsRepo.save(comment);

    await this.keywordAlertService.checkAndSendAlerts(saved.content, saved.author);

    return saved;
  }

  async readCommentsByPost(
    postId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<NestedCommentDto>> {
    const [comments, total] = await this.commentsRepo.findByPostId(postId, query.page, query.limit);

    const parentComments = comments.filter((c) => !c.parentCommentId);
    const childrenMap = this.groupChildrenByParent(comments);

    const items = parentComments.map((parent) => this.toNestedCommentDto(parent, childrenMap));

    return {
      total,
      page: query.page,
      limit: query.limit,
      items,
    };
  }

  async delete(postId: number, commentId: number): Promise<void> {
    const comment = await this.commentsRepo.findById(commentId);
    if (!comment || comment.postId !== postId) {
      this.logger.warn(
        `Comment not found or mismatched (commentId=${commentId}, postId=${postId})`,
      );
      throw new NotFoundException('Comment not found');
    }

    await this.commentsRepo.softRemove(comment);
  }

  private groupChildrenByParent(comments: Comment[]): Map<number, Comment[]> {
    const map = new Map<number, Comment[]>();
    comments
      .filter((c) => !!c.parentCommentId)
      .forEach((child) => {
        const list = map.get(child.parentCommentId!) ?? [];
        map.set(child.parentCommentId!, [...list, child]);
      });
    return map;
  }

  private toNestedCommentDto(
    parent: Comment,
    childrenMap: Map<number, Comment[]>,
  ): NestedCommentDto {
    const children = (childrenMap.get(parent.id) ?? []).map((child) => ({
      ...child,
      content: this.getVisibleContent(child.content, child.deletedAt),
    }));

    return {
      id: parent.id,
      author: parent.author,
      content: this.getVisibleContent(parent.content, parent.deletedAt),
      createdAt: parent.createdAt,
      parentCommentId: parent.parentCommentId ?? null,
      children,
    };
  }

  private getVisibleContent(content: string, deletedAt?: Date): string {
    return deletedAt ? '[Deleted Comment]' : content;
  }
}
