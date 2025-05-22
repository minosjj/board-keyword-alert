import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsString()
  author: string;

  @IsOptional()
  @IsInt()
  parentCommentId?: number;
}
