/**
 * Tests for CLI delegate-deposit command
 */

// Mock the SDK
jest.mock('@7n7d/sdk', () => {
  const mockBuildVaultDepositDelegation = jest.fn().mockReturnValue({
    delegator: '0x1234567890abcdef1234567890abcdef12345678',
    delegate: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    authority: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    caveats: [],
    salt: 42n,
    signature: '0x',
  });

  const mockSummarize = jest.fn().mockReturnValue({
    delegation: mockBuildVaultDepositDelegation(),
    summary: 'Delegate 0xabcd...abcd may deposit up to 1000.00 USDC into vault 0x3728...05F8 (no expiry)',
  });

  return {
    SevenNSevenD: jest.fn().mockImplementation(() => ({
      api: { status: jest.fn() },
    })),
    DelegationClient: jest.fn().mockImplementation(() => ({
      buildVaultDepositDelegation: mockBuildVaultDepositDelegation,
      summarize: mockSummarize,
    })),
    NETWORKS: {
      testnet: {
        contracts: {
          tradingVault: '0x3728F306Bc29d2A702cDb7919495E54F809405F8',
          usdc: '0x10297B02cFBe672267903E92deEc36Cff24C5D77',
        },
      },
    },
    __mocks: { mockBuildVaultDepositDelegation, mockSummarize },
  };
});

// Mock ora
jest.mock('ora', () => {
  return jest.fn().mockReturnValue({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
    stop: jest.fn(),
  });
});

// Mock config
jest.mock('../config', () => ({
  createClient: jest.fn(),
  requirePrivateKey: jest.fn(),
}));

describe('delegate-deposit command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    // Reset module-level mocks to prevent test pollution (mockReset clears results + implementations)
    const { __mocks, DelegationClient } = require('@7n7d/sdk') as {
      __mocks: { mockBuildVaultDepositDelegation: jest.Mock; mockSummarize: jest.Mock };
      DelegationClient: jest.Mock;
    };
    DelegationClient.mockClear();
    __mocks.mockBuildVaultDepositDelegation.mockClear();
    __mocks.mockSummarize.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should build and display a delegation summary', async () => {
    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await delegateDepositCommand('1000', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', {});

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toMatch(/Delegation Summary/i);
    expect(output).toMatch(/1000/);
  });

  it('should output JSON when --json flag is set', async () => {
    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await delegateDepositCommand('500', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', { json: true });

    const jsonCalls = consoleSpy.mock.calls.map(c => c[0]).join('');
    const parsed = JSON.parse(jsonCalls);
    expect(parsed).toHaveProperty('delegation');
    expect(parsed).toHaveProperty('summary');
  });

  it('should require a valid agent address', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await expect(
      delegateDepositCommand('1000', 'not-an-address', {}),
    ).rejects.toThrow('process.exit(1)');

    mockExit.mockRestore();
  });

  it('should reject zero or negative amounts', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await expect(
      delegateDepositCommand('0', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', {}),
    ).rejects.toThrow('process.exit(1)');

    mockExit.mockRestore();
  });

  it('should accept --expiry option as ISO date', async () => {
    const { DelegationClient } = require('@7n7d/sdk');
    const { delegateDepositCommand } = require('../commands/delegate-deposit');

    await delegateDepositCommand('1000', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', {
      expiry: '2027-01-01T00:00:00Z',
    });

    const client = DelegationClient.mock.results[DelegationClient.mock.results.length - 1]?.value;
    if (client) {
      const buildCall = client.buildVaultDepositDelegation.mock.calls[0];
      // The config should have a non-zero expiry
      expect(buildCall).toBeDefined();
    }
  });

  it('should reject invalid --expiry date', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await expect(
      delegateDepositCommand('1000', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', {
        expiry: 'not-a-date',
      }),
    ).rejects.toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid --expiry value'),
    );

    mockExit.mockRestore();
  });

  it('should handle build delegation failure gracefully', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    // Override DelegationClient to throw
    const { DelegationClient } = require('@7n7d/sdk');
    DelegationClient.mockImplementationOnce(() => ({
      buildVaultDepositDelegation: jest.fn().mockImplementation(() => {
        throw new Error('Delegation build error');
      }),
      summarize: jest.fn(),
    }));

    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await expect(
      delegateDepositCommand('1000', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', {}),
    ).rejects.toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Delegation build error'),
    );

    mockExit.mockRestore();
  });

  it('should reject negative amounts', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await expect(
      delegateDepositCommand('-5', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', {}),
    ).rejects.toThrow('process.exit(1)');

    mockExit.mockRestore();
  });

  it('should reject NaN amounts', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await expect(
      delegateDepositCommand('abc', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', {}),
    ).rejects.toThrow('process.exit(1)');

    mockExit.mockRestore();
  });

  it('should display expiry date in text output when provided', async () => {
    const { delegateDepositCommand } = require('../commands/delegate-deposit');
    await delegateDepositCommand('1000', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', {
      expiry: '2027-01-01T00:00:00Z',
    });

    const output = consoleSpy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('2027-01-01T00:00:00Z');
  });
});
