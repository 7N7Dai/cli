/**
 * Tests for CLI withdraw command
 */

const mockWithdraw = jest.fn();

jest.mock('@7n7d/sdk', () => ({
  SevenNSevenD: jest.fn().mockImplementation(() => ({
    vault: { withdraw: mockWithdraw },
  })),
}));

jest.mock('ora', () =>
  jest.fn().mockReturnValue({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
  }),
);

const mockRequirePrivateKey = jest.fn();

jest.mock('../config', () => ({
  createClient: jest.fn(() => {
    const { SevenNSevenD } = require('@7n7d/sdk');
    return new SevenNSevenD({ apiKey: 'test' });
  }),
  requirePrivateKey: mockRequirePrivateKey,
}));

import { withdrawCommand } from '../commands/withdraw';

describe('withdraw command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWithdraw.mockClear();
    mockRequirePrivateKey.mockClear();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    mockWithdraw.mockResolvedValue({
      txHash: '0xwithdraw789',
      explorerLink: 'https://sepolia.arbiscan.io/tx/0xwithdraw789',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display withdrawal success with tx details', async () => {
    await withdrawCommand('50', {});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('50');
    expect(output).toContain('0xwithdraw789');
    expect(output).toContain('7-day withdrawal lock');
  });

  it('should call requirePrivateKey before withdrawing', async () => {
    await withdrawCommand('50', {});
    expect(mockRequirePrivateKey).toHaveBeenCalled();
    expect(mockWithdraw).toHaveBeenCalled();
    // Verify requirePrivateKey was called before withdraw
    expect(mockRequirePrivateKey.mock.invocationCallOrder[0]).toBeLessThan(
      mockWithdraw.mock.invocationCallOrder[0],
    );
  });

  it('should output JSON when --json flag is set', async () => {
    await withdrawCommand('50', { json: true });

    const jsonOutput = consoleSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.txHash).toBe('0xwithdraw789');
  });

  it('should handle withdrawal failure gracefully', async () => {
    mockWithdraw.mockRejectedValue(new Error('Withdrawal locked'));

    await expect(withdrawCommand('50', {})).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Withdrawal locked'),
    );
  });
});
