import { IsString } from 'class-validator';

export class DeletePostDto {
  @IsString()
  password: string;
}
