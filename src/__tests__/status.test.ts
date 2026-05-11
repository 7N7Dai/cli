/**
 * Tests for CLI status command — vault on-chain data display
 */

// Mock the SDK before importing
jest.mock('@7n7d/sdk', () => {
  const mockSharePrice = jest.fn().mockResolvedValue('1.000000');
  const mockTotalAssets = jest.fn().mockResolvedValue('50000.000000');
  const mockApiStatus = jest.fn().mockResolvedValue({
    data: {
      vault: { status: 'active', network: 'testnet' },
      agent: { status: 'running', positions: 3 },
    },
  });

  return {
    SevenNSevenD: jest.fn().mockImplementation(() => ({
      api: { status: mockApiStatus },
      vault: {
        sharePrice: mockSharePrice,
        totalAssets: mockTotalAssets,
      },
    })),
    __mocks: { mockSharePrice, mockTotalAssets, mockApiStatus },
  };
});

// Mock ora
jest.mock('ora', () => {
  return jest.fn().mockReturnValue({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    fail: jest.fn(),
  });
});

// Mock config
jest.mock('../config', () => ({
  createClient: jest.fn(() => {
    const { SevenNSevenD } = require('@7n7d/sdk');
    return new SevenNSevenD({ apiKey: 'test' });
  }),
}));

describe('status command', () => {
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

  it('should display share price formatted in USDC', async () => {
    const { statusCommand } = require('../commands/status');
    await statusCommand({});

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    // Should contain share price as formatted USDC (not raw wei)
    expect(output).toMatch(/Share Price/i);
    expect(output).toContain('1.000000');
    // Should NOT contain raw wei value
    expect(output).not.toContain('1000000000000');
  });

  it('should display TVL formatted in USDC', async () => {
    const { statusCommand } = require('../commands/status');
    await statusCommand({});

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toMatch(/TVL/i);
    expect(output).toContain('50000.000000');
  });

  it('should output share price in JSON mode', async () => {
    const jsonSpy = jest.spyOn(console, 'log').mockImplementation();
    const { statusCommand } = require('../commands/status');
    await statusCommand({ json: true });

    const jsonOutput = jsonSpy.mock.calls.map(c => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);

    expect(parsed.vault).toBeDefined();
    expect(parsed.vault.sharePrice).toBe('1.000000');
    expect(parsed.vault.tvl).toBe('50000.000000');
  });

  it('should handle API failure gracefully with N/A values', async () => {
    const { __mocks } = require('@7n7d/sdk');
    __mocks.mockApiStatus.mockRejectedValueOnce(new Error('API down'));
    __mocks.mockSharePrice.mockRejectedValueOnce(new Error('RPC error'));
    __mocks.mockTotalAssets.mockRejectedValueOnce(new Error('RPC error'));

    const { statusCommand } = require('../commands/status');
    // The .catch(() => null) in the command means these resolve to null
    await statusCommand({});

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('N/A');
    expect(output).toContain('unknown');
  });

  it('should show N/A values in JSON mode when API fails', async () => {
    const { __mocks } = require('@7n7d/sdk');
    __mocks.mockApiStatus.mockRejectedValueOnce(new Error('API down'));
    __mocks.mockSharePrice.mockRejectedValueOnce(new Error('RPC error'));
    __mocks.mockTotalAssets.mockRejectedValueOnce(new Error('RPC error'));

    const { statusCommand } = require('../commands/status');
    await statusCommand({ json: true });

    const jsonOutput = consoleSpy.mock.calls.map(c => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.vault.sharePrice).toBe('N/A');
    expect(parsed.vault.tvl).toBe('N/A');
    expect(parsed.vault.status).toBe('unknown');
    expect(parsed.agent.status).toBe('unknown');
  });

  it('should handle complete command failure with process.exit', async () => {
    // Mock createClient to throw directly (not caught by .catch)
    jest.resetModules();
    jest.doMock('../config', () => ({
      createClient: jest.fn(() => { throw new Error('Config error'); }),
    }));
    jest.doMock('ora', () => jest.fn().mockReturnValue({
      start: jest.fn().mockReturnThis(),
      stop: jest.fn(),
      fail: jest.fn(),
    }));

    const { statusCommand } = require('../commands/status');
    await expect(statusCommand({})).rejects.toThrow('process.exit(1)');
  });
});
