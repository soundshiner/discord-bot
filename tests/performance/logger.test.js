import logger from '../../bot/logger';

describe('Performance Logger', () => {
  beforeEach(() => {
    // Réinitialise les métriques avant chaque test
    logger.metrics.totalLogs = 0;
    logger.metrics.logsByLevel = {};
    logger.metrics.performance.totalWriteTime = 0;
    logger.metrics.performance.writeCount = 0;
    logger.metrics.performance.avgWriteTime = 0;
  });

  // ⚙️ Métriques
  it('should track logging metrics', async () => {
    await logger.info('Test log');
    const metrics = logger.getMetrics();

    expect(typeof metrics.totalLogs).toBe('number');
    expect(metrics.totalLogs).toBe(1);
    expect(metrics.logsByLevel.INFO).toBe(1);
  });

  it('should track performance metrics when file logging is enabled', async () => {
    await logger.debug('Debug message');
    const { performance } = logger.getMetrics();

    expect(performance.writeCount).toBeGreaterThan(0);
    expect(performance.avgWriteTime).toBeGreaterThan(0);
  });

  it('should have performance metrics structure', () => {
    const metrics = logger.getMetrics();
    expect(metrics).toHaveProperty('totalLogs');
    expect(metrics).toHaveProperty('logsByLevel');
    expect(metrics).toHaveProperty('performance');
    expect(metrics.performance).toHaveProperty('writeCount');
    expect(metrics.performance).toHaveProperty('avgWriteTime');
  });

  // 🎨 Formatage
  it('should format structured logs in production', async () => {
    const testData = { data: 'value' };
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await logger.info('Structured test', testData);

    const lastCall = spy.mock.calls.at(-1)?.[0];
    expect(lastCall).toContain('[INFO]');
    expect(lastCall).toContain('"data":"value"');
    spy.mockRestore();
  });

  // 🛠️ Compatibilité (si tu veux vraiment garder les anciens alias)
  it('should maintain backward compatibility', async () => {
    expect(typeof logger.command).toBe('function');
    await logger.command('Commande test');
    const metrics = logger.getMetrics();
    expect(metrics.logsByLevel.CMD).toBe(1);
  });

  it('should handle section formatting', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => {});
    logger.section('Test Section');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
