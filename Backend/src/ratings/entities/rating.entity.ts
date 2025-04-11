import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Movie } from '../../movies/entities/movie.entity';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  score!: number;

  @ManyToOne(() => User)
  user!: User;

  @ManyToOne(() => Movie)
  movie!: Movie;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 