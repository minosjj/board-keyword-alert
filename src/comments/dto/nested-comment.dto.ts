import { Comment } from 'src/comments/entities/comment.entity';

export class NestedCommentDto {
  id: number;
  author: string;
  content: string;
  createdAt: Date;
  parentCommentId: number;
  children: Comment[];
}
