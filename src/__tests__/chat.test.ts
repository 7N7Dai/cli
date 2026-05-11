/**
 * Tests for CLI chat command
 */

const mockChat = jest.fn();

jest.mock('@7n7d/sdk', () => ({
  SevenNSevenD: jest.fn().mockImplementation(() => ({
    api: { chat: mockChat },
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

import { chatCommand } from '../commands/chat';

describe('chat command', () => {
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    mockChat.mockResolvedValue({
      data: {
        response: 'The vault is performing well with 5% returns.',
        intent: 'general',
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display agent response', async () => {
    await chatCommand('How is the vault?', {});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Agent Response');
    expect(output).toContain('The vault is performing well with 5% returns.');
  });

  it('should display intent when not general', async () => {
    mockChat.mockResolvedValue({
      data: {
        response: 'Your deposit has been queued.',
        intent: 'deposit',
      },
    });

    await chatCommand('Deposit 100 USDC', {});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('deposit');
  });

  it('should not display intent when general', async () => {
    await chatCommand('Hello', {});

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).not.toContain('Intent:');
  });

  it('should output JSON when --json flag is set', async () => {
    await chatCommand('Hello', { json: true });

    const jsonOutput = consoleSpy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(jsonOutput);
    expect(parsed.response).toBe('The vault is performing well with 5% returns.');
    expect(parsed.intent).toBe('general');
  });

  it('should handle API errors gracefully', async () => {
    mockChat.mockRejectedValue(new Error('Agent unavailable'));

    await expect(chatCommand('Hello', {})).rejects.toThrow('process.exit(1)');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Agent unavailable'));
  });
});
