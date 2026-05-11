/**
 * Tests for CLI positions command
 */

const mockPositions = jest.fn();

jest.mock('@7n7d/sdk', () => ({
  SevenNSevenD: jest.fn().mockImplementation(() => ({
    api: { positions: mockPositions },
  })),
}));

jest.mock('ora', () =>
  jest.fn().mockReturnValue({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    fail: jest.fn(),
  }),
);

jest.mock('../config', () => ({
  createClient: jest.fn(() => {
    const { SevenNSevenD } = require('@7n7d/sdk');
    return new SevenNSevenD({ apiKey: 'test' });
  }),
}));

import { positionsCommand } from '../commands/positions';

describe('positions command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display positions when they exist', async () => {
    mockPositions.mockResolvedValue({
      data: {
        positions: [
          { asset: 'ETH', size: '1.5', side: 'long', pnl: '+$120' },
          { asset: 'BTC', size: '0.1', side: 'short', pnl: '-$30' },
        ],
      },
    });

    await positionsCommand({});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Open Positions');
    expect(output).toContain('ETH');
    expect(output).toContain('BTC');
  });

  it('should display message when no positions exist', async () => {
    mockPositions.mockResolvedValue({ data: { positions: [] } });

    await positionsCommand({});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('No open positions');
  });

  it('should output JSON when --json flag is set', async () => {
    mockPositions.mockResolvedValue({
      data: {
        positions: [{ asset: 'ETH', size: '1.5', side: 'long', pnl: '+$120' }],
      },
    });

    await positionsCommand({ json: true });

    const jsonOutput = consoleSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.positions).toHaveLength(1);
    expect(parsed.positions[0].asset).toBe('ETH');
  });

  it('should handle API errors gracefully', async () => {
    mockPositions.mockRejectedValue(new Error('API timeout'));

    await expect(positionsCommand({})).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('API timeout'));
  });
});
