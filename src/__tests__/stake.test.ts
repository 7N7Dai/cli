/**
 * Tests for CLI stake command
 */

const mockStake = jest.fn();

jest.mock('@7n7d/sdk', () => ({
  SevenNSevenD: jest.fn().mockImplementation(() => ({
    staking: { stake: mockStake },
  })),
}));

jest.mock('ora', () =>
  jest.fn().mockReturnValue({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
  }),
);

jest.mock('../config', () => ({
  createClient: jest.fn(() => {
    const { SevenNSevenD } = require('@7n7d/sdk');
    return new SevenNSevenD({ apiKey: 'test' });
  }),
  requirePrivateKey: jest.fn(),
}));

import { stakeCommand } from '../commands/stake';

describe('stake command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStake.mockClear();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    mockStake.mockResolvedValue({
      txHash: '0xstake123',
      explorerLink: 'https://sepolia.arbiscan.io/tx/0xstake123',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display staking success with tx details', async () => {
    await stakeCommand('500', {});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('500');
    expect(output).toContain('0xstake123');
  });

  it('should call requirePrivateKey before staking', async () => {
    const { requirePrivateKey } = require('../config') as { requirePrivateKey: jest.Mock };
    await stakeCommand('500', {});
    expect(requirePrivateKey).toHaveBeenCalled();
    expect(mockStake).toHaveBeenCalled();
    expect(requirePrivateKey.mock.invocationCallOrder[0]).toBeLessThan(
      mockStake.mock.invocationCallOrder[0],
    );
  });

  it('should output JSON when --json flag is set', async () => {
    await stakeCommand('500', { json: true });

    const jsonOutput = consoleSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.txHash).toBe('0xstake123');
  });

  it('should handle staking failure gracefully', async () => {
    mockStake.mockRejectedValue(new Error('Insufficient 7N7D tokens'));

    await expect(stakeCommand('999999', {})).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Insufficient 7N7D tokens'),
    );
  });
});
