/**
 * Tests for CLI balance command
 */

const mockBalance = jest.fn();
const mockTokenBalance = jest.fn();
const mockStakingBalance = jest.fn();
const mockStakingEarned = jest.fn();

jest.mock('@7n7d/sdk', () => ({
  SevenNSevenD: jest.fn().mockImplementation(() => ({
    vault: { balance: mockBalance },
    token: { balance: mockTokenBalance },
    staking: { balance: mockStakingBalance, earned: mockStakingEarned },
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

import { balanceCommand } from '../commands/balance';

describe('balance command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBalance.mockClear();
    mockTokenBalance.mockClear();
    mockStakingBalance.mockClear();
    mockStakingEarned.mockClear();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    mockBalance.mockResolvedValue('1000.00');
    mockTokenBalance.mockResolvedValue('5000.00');
    mockStakingBalance.mockResolvedValue('2000.00');
    mockStakingEarned.mockResolvedValue('150.50');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display balances for a given address', async () => {
    await balanceCommand('0x1234567890abcdef1234567890abcdef12345678', {});

    expect(mockBalance).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
    expect(mockTokenBalance).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
    expect(mockStakingBalance).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
    expect(mockStakingEarned).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('1000.00');
    expect(output).toContain('5000.00');
    expect(output).toContain('2000.00');
    expect(output).toContain('150.50');
  });

  it('should output JSON when --json flag is set', async () => {
    await balanceCommand('0x1234567890abcdef1234567890abcdef12345678', { json: true });

    expect(mockBalance).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
    expect(mockTokenBalance).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
    expect(mockStakingBalance).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');
    expect(mockStakingEarned).toHaveBeenCalledWith('0x1234567890abcdef1234567890abcdef12345678');

    const jsonOutput = consoleSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
    expect(parsed.vaultBalance).toBe('1000.00');
    expect(parsed.tokenBalance).toBe('5000.00');
    expect(parsed.stakedBalance).toBe('2000.00');
    expect(parsed.pendingRewards).toBe('150.50');
  });

  it('should exit(1) when no address is provided', async () => {
    await expect(balanceCommand(undefined, {})).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Provide an address'),
    );
  });

  it('should handle API errors gracefully', async () => {
    mockBalance.mockRejectedValue(new Error('Network error'));

    await expect(
      balanceCommand('0x1234567890abcdef1234567890abcdef12345678', {}),
    ).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Network error'));
  });
});
