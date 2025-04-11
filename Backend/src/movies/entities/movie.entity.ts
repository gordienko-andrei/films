import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { Rating } from '../../ratings/entities/rating.entity';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  releaseYear!: number;

  @Column('simple-array')
  genres!: string[];

  @Column()
  director!: string;

  @Column('simple-array')
  cast!: string[];

  @Column()
  posterUrl!: string;

  @Column()
  duration!: number; // in minutes

  @OneToMany(() => Review, review => review.movie)
  reviews!: Review[];

  @OneToMany(() => Rating, rating => rating.movie)
  ratings!: Rating[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 