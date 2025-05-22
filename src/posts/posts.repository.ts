import { Injectable } from '@nestjs/common';
import { ReadPostsQueryDto } from 'src/posts/dto/read-posts-query.dto';
import { Post } from 'src/posts/entities/post.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PostsRepository extends Repository<Post> {
  constructor(private dataSource: DataSource) {
    super(Post, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<Post | null> {
    return this.findOneBy({ id });
  }

  async findWithQuery(dto: ReadPostsQueryDto) {
    const { page, limit, author, title } = dto;
    const skip = (page - 1) * limit;

    const qb = this.createQueryBuilder('post')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (author) {
      qb.andWhere('post.author = :author', { author });
    }

    if (title) {
      qb.andWhere('MATCH(post.title) AGAINST (:title IN BOOLEAN MODE)', { title: `+${title}` });
    }

    return qb.getManyAndCount();
  }
}
