import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Пытается прочитать JWT; при отсутствии/ошибке не блокирует запрос, user в req может быть null. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // гость
    }
    return true;
  }

  handleRequest<TUser = unknown>(err: Error | null, user: TUser): TUser | null {
    if (err) {
      return null;
    }
    return user ?? null;
  }
}
