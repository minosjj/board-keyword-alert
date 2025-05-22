import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Post } from 'src/posts/entities/post.entity';
import { PostsController } from 'src/posts/posts.controller';
import { PostsService } from 'src/posts/posts.service';
import { PostsRepository } from 'src/posts/posts.repository';
import { KeywordAlertModule } from 'src/alerts/keyword-alert.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), KeywordAlertModule],
  controllers: [PostsController],
  providers: [PostsService, PostsRepository],
  exports: [PostsRepository],
})
export class PostsModule {}
