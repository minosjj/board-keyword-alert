import {
  Post as HttpPost,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { PostsService } from 'src/posts/posts.service';
import { ReadPostsQueryDto } from 'src/posts/dto/read-posts-query.dto';
import { CreatePostDto } from 'src/posts/dto/create-post.dto';
import { UpdatePostDto } from 'src/posts/dto/update-post.dto';
import { DeletePostDto } from 'src/posts/dto/delete-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  async createPost(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto);
  }

  @Get()
  async readPosts(@Query() query: ReadPostsQueryDto) {
    return this.postsService.readPosts(query);
  }

  @Put(':id')
  async updatePost(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  async deletePost(@Param('id', ParseIntPipe) id: number, @Body() dto: DeletePostDto) {
    await this.postsService.delete(id, dto);
    return { msg: 'success', data: null };
  }
}
