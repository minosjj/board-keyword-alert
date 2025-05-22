import { Controller, Post, Delete, Param, Body, ParseIntPipe, Get, Query } from '@nestjs/common';
import { CommentsService } from 'src/comments/comments.service';
import { CreateCommentDto } from 'src/comments/dto/create-comment.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async createComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, dto);
  }

  @Get()
  async readComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.commentsService.readCommentsByPost(postId, query);
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
  ) {
    await this.commentsService.delete(postId, commentId);
    return { msg: 'success', data: null };
  }
}
