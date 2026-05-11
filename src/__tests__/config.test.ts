/**
 * Tests for config — createClient and requirePrivateKey
 */

// We need to control env vars and file system per test, so reset modules each time
describe('config', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let mockExit: jest.SpyInstance;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number | string | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });
    // Clear relevant env vars
    delete process.env.SEVEN_N_SEVEN_D_API_KEY;
    delete process.env.SEVEN_N_SEVEN_D_API_URL;
    delete process.env.SEVEN_N_SEVEN_D_RPC_URL;
    delete process.env.SEVEN_N_SEVEN_D_PRIVATE_KEY;
    delete process.env.SEVEN_N_SEVEN_D_NETWORK;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  function setupMocks(fileConfig: Record<string, any> | null) {
    // Mock fs to control config file reading
    jest.doMock('fs', () => ({
      existsSync: jest.fn().mockReturnValue(fileConfig !== null),
      readFileSync: jest.fn().mockReturnValue(
        fileConfig !== null ? JSON.stringify(fileConfig) : '',
      ),
    }));
    jest.doMock('os', () => ({
      homedir: jest.fn().mockReturnValue('/mock/home'),
    }));
    // Mock the SDK
    jest.doMock('@7n7d/sdk', () => ({
      SevenNSevenD: jest.fn().mockImplementation((config: any) => ({ _config: config })),
    }));
  }

  describe('createClient', () => {
    it('should create client from env vars', () => {
      process.env.SEVEN_N_SEVEN_D_API_KEY = 'test-key-123';
      process.env.SEVEN_N_SEVEN_D_NETWORK = 'mainnet';
      setupMocks(null);

      const { createClient } = require('../config');
      const { SevenNSevenD } = require('@7n7d/sdk');
      createClient();

      expect(SevenNSevenD).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-key-123',
          network: 'mainnet',
        }),
      );
    });

    it('should create client from config file', () => {
      setupMocks({
        apiKey: 'file-key-456',
        apiUrl: 'https://custom.api',
        rpcUrl: 'https://custom.rpc',
        privateKey: '0xabc',
        network: 'mainnet',
      });

      const { createClient } = require('../config');
      const { SevenNSevenD } = require('@7n7d/sdk');
      createClient();

      expect(SevenNSevenD).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'file-key-456',
          apiUrl: 'https://custom.api',
          rpcUrl: 'https://custom.rpc',
          privateKey: '0xabc',
          network: 'mainnet',
        }),
      );
    });

    it('should prefer env vars over config file', () => {
      process.env.SEVEN_N_SEVEN_D_API_KEY = 'env-key';
      process.env.SEVEN_N_SEVEN_D_API_URL = 'https://env.api';
      setupMocks({ apiKey: 'file-key', apiUrl: 'https://file.api' });

      const { createClient } = require('../config');
      const { SevenNSevenD } = require('@7n7d/sdk');
      createClient();

      expect(SevenNSevenD).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'env-key',
          apiUrl: 'https://env.api',
        }),
      );
    });

    it('should exit(1) when no API key is provided', () => {
      setupMocks(null);

      const { createClient } = require('../config');
      expect(() => createClient()).toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('API key required'),
      );
    });

    it('should default to testnet when no network specified', () => {
      process.env.SEVEN_N_SEVEN_D_API_KEY = 'test-key';
      setupMocks(null);

      const { createClient } = require('../config');
      const { SevenNSevenD } = require('@7n7d/sdk');
      createClient();

      expect(SevenNSevenD).toHaveBeenCalledWith(
        expect.objectContaining({ network: 'testnet' }),
      );
    });

    it('should handle malformed config file gracefully', () => {
      process.env.SEVEN_N_SEVEN_D_API_KEY = 'test-key';
      jest.doMock('fs', () => ({
        existsSync: jest.fn().mockReturnValue(true),
        readFileSync: jest.fn().mockReturnValue('not valid json {{{'),
      }));
      jest.doMock('os', () => ({
        homedir: jest.fn().mockReturnValue('/mock/home'),
      }));
      jest.doMock('@7n7d/sdk', () => ({
        SevenNSevenD: jest.fn().mockImplementation((config: any) => ({ _config: config })),
      }));

      const { createClient } = require('../config');
      const client = createClient();
      expect(client).toBeDefined();
    });

    it('should handle missing config file gracefully', () => {
      process.env.SEVEN_N_SEVEN_D_API_KEY = 'test-key';
      setupMocks(null);

      const { createClient } = require('../config');
      const client = createClient();
      expect(client).toBeDefined();
    });
  });

  describe('requirePrivateKey', () => {
    it('should not exit when private key is in env', () => {
      process.env.SEVEN_N_SEVEN_D_PRIVATE_KEY = '0xdeadbeef';
      setupMocks(null);

      const { requirePrivateKey } = require('../config');
      expect(() => requirePrivateKey()).not.toThrow();
    });

    it('should not exit when private key is in config file', () => {
      setupMocks({ privateKey: '0xdeadbeef' });

      const { requirePrivateKey } = require('../config');
      expect(() => requirePrivateKey()).not.toThrow();
    });

    it('should exit(1) when no private key is available', () => {
      setupMocks(null);

      const { requirePrivateKey } = require('../config');
      expect(() => requirePrivateKey()).toThrow('process.exit(1)');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Private key required'),
      );
    });
  });
});
