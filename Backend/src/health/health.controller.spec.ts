import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok status with timestamp', () => {
    const controller = new HealthController();
    const result = controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.timestamp).toEqual(expect.any(String));
    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(result.memory).toBeDefined();
  });
});
