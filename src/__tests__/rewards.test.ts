/**
 * Tests for CLI rewards command
 */

const mockEarned = jest.fn();

jest.mock('@7n7d/sdk', () => ({
  SevenNSevenD: jest.fn().mockImplementation(() => ({
    staking: { earned: mockEarned },
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

import { rewardsCommand } from '../commands/rewards';

describe('rewards command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    mockEarned.mockResolvedValue('250.75');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display pending rewards for an address', async () => {
    await rewardsCommand('0x1234567890abcdef1234567890abcdef12345678', {});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Pending Rewards');
    expect(output).toContain('250.75');
  });

  it('should output JSON when --json flag is set', async () => {
    await rewardsCommand('0x1234567890abcdef1234567890abcdef12345678', { json: true });

    const jsonOutput = consoleSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
    expect(parsed.earned).toBe('250.75');
  });

  it('should exit(1) when no address is provided', async () => {
    await expect(rewardsCommand(undefined, {})).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Provide an address'),
    );
  });

  it('should handle API errors gracefully', async () => {
    mockEarned.mockRejectedValue(new Error('Staking contract error'));

    await expect(
      rewardsCommand('0x1234567890abcdef1234567890abcdef12345678', {}),
    ).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Staking contract error'),
    );
  });
});
