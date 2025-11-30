import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CriteriaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.reviewCriterionTemplate.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.reviewCriterionTemplate.findUnique({
      where: { id },
    });
  }
}

