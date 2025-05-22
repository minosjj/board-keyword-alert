import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Comment } from 'src/comments/entities/comment.entity';

@Injectable()
export class CommentsRepository extends Repository<Comment> {
  constructor(private dataSource: DataSource) {
    super(Comment, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<Comment | null> {
    return this.findOneBy({ id });
  }

  async findByPostId(postId: number, page: number, limit: number): Promise<[Comment[], number]> {
    const skip = (page - 1) * limit;

    const [comments, total] = await this.createQueryBuilder('comment')
      .withDeleted()
      .where('comment.postId = :postId', { postId })
      .orderBy('comment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return [comments, total];
  }
}
