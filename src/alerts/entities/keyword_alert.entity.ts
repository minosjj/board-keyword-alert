import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('keyword_alerts')
export class KeywordAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  owner: string;

  @Column()
  keyword: string;
}
