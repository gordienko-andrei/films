import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const makeContext = (role?: string): ExecutionContext =>
    ({
      getClass: () => class DummyClass {},
      getHandler: () => function dummyHandler() {
        return null;
      },
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : {} }),
      }),
    }) as unknown as ExecutionContext;

  it('allows when route does not require roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(makeContext('USER'))).toBe(true);
  });

  it('allows when user role matches required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(makeContext('ADMIN'))).toBe(true);
  });

  it('throws when user role does not match', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(makeContext('USER'))).toThrow('Insufficient permissions');
  });
});
