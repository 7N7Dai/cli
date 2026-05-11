/**
 * Tests for CLI deposit command
 */

const mockDeposit = jest.fn();

jest.mock('@7n7d/sdk', () => ({
  SevenNSevenD: jest.fn().mockImplementation(() => ({
    vault: { deposit: mockDeposit },
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

import { depositCommand } from '../commands/deposit';

describe('deposit command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    mockDeposit.mockResolvedValue({
      txHash: '0xabc123',
      explorerLink: 'https://sepolia.arbiscan.io/tx/0xabc123',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display deposit success with tx details', async () => {
    await depositCommand('1000', {});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('1000');
    expect(output).toContain('0xabc123');
    expect(output).toContain('sepolia.arbiscan.io');
  });

  it('should call requirePrivateKey before depositing', async () => {
    const { requirePrivateKey } = require('../config');
    await depositCommand('500', {});
    expect(requirePrivateKey).toHaveBeenCalled();
  });

  it('should output JSON when --json flag is set', async () => {
    await depositCommand('1000', { json: true });

    const jsonOutput = consoleSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.txHash).toBe('0xabc123');
    expect(parsed.explorerLink).toContain('sepolia.arbiscan.io');
  });

  it('should handle deposit failure gracefully', async () => {
    mockDeposit.mockRejectedValue(new Error('Insufficient USDC balance'));

    await expect(depositCommand('1000000', {})).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Insufficient USDC balance'),
    );
  });
});
