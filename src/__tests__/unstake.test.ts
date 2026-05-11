/**
 * Tests for CLI unstake command
 */

const mockUnstake = jest.fn();

jest.mock('@7n7d/sdk', () => ({
  SevenNSevenD: jest.fn().mockImplementation(() => ({
    staking: { unstake: mockUnstake },
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

import { unstakeCommand } from '../commands/unstake';

describe('unstake command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    mockUnstake.mockResolvedValue({
      txHash: '0xunstake456',
      explorerLink: 'https://sepolia.arbiscan.io/tx/0xunstake456',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display unstaking success with tx details', async () => {
    await unstakeCommand('300', {});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('300');
    expect(output).toContain('0xunstake456');
  });

  it('should call requirePrivateKey before unstaking', async () => {
    const { requirePrivateKey } = require('../config');
    await unstakeCommand('300', {});
    expect(requirePrivateKey).toHaveBeenCalled();
  });

  it('should output JSON when --json flag is set', async () => {
    await unstakeCommand('300', { json: true });

    const jsonOutput = consoleSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.txHash).toBe('0xunstake456');
  });

  it('should handle unstaking failure gracefully', async () => {
    mockUnstake.mockRejectedValue(new Error('Unstaking locked'));

    await expect(unstakeCommand('300', {})).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unstaking locked'),
    );
  });
});
