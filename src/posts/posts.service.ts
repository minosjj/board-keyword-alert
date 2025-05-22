import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KeywordAlertService } from 'src/alerts/keyword-alert.service';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { DeletePostDto } from 'src/posts/dto/delete-post.dto';
import { ReadPostsQueryDto } from 'src/posts/dto/read-posts-query.dto';
import { UpdatePostDto } from 'src/posts/dto/update-post.dto';
import { Post } from 'src/posts/entities/post.entity';
import { PostsRepository } from 'src/posts/posts.repository';

@Injectable()
export class PostsService {
  private readonly logger: Logger = new Logger(PostsService.name);
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly keywordAlertService: KeywordAlertService,
  ) {}

  async create(dto: CreatePostDto): Promise<Post> {
    const post: Post = this.postsRepository.create(dto);
    const saved = await this.postsRepository.save(post);

    await this.keywordAlertService.checkAndSendAlerts(saved.content, saved.author);

    return saved;
  }

  async readPosts(query: ReadPostsQueryDto): Promise<PaginatedResponse<Post>> {
    const [posts, total] = await this.postsRepository.findWithQuery(query);
    return {
      total,
      page: query.page,
      limit: query.limit,
      items: posts,
    };
  }

  async update(id: number, dto: UpdatePostDto): Promise<Post> {
    const post: Post = await this.getPostOrFail(id);
    this.assertPasswordValid(post, dto.password);

    post.title = dto.title;
    post.content = dto.content;

    const saved = await this.postsRepository.save(post);
    await this.keywordAlertService.checkAndSendAlerts(saved.content, saved.author);

    return saved;
  }

  async delete(id: number, dto: DeletePostDto): Promise<void> {
    const post: Post = await this.getPostOrFail(id);
    this.assertPasswordValid(post, dto.password);

    await this.postsRepository.remove(post);
  }

  private async getPostOrFail(id: number): Promise<Post> {
    const post = await this.postsRepository.findById(id);
    if (!post) {
      this.logger.warn(`Post not found (id: ${id})`);
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  private assertPasswordValid(post: Post, password: string): void {
    if (post.password !== password) {
      this.logger.warn(`Password mismatch for postId=${post.id}`);
      throw new ForbiddenException('Incorrect password');
    }
  }
}
