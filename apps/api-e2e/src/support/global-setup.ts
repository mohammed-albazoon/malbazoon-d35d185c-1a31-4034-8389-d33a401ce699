/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

async function waitForPort(port: number, host: string, timeout: number): Promise<boolean> {
  const net = await import('net');
  const startTime = Date.now();

  return new Promise((resolve) => {
    const tryConnect = () => {
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      const socket = new net.Socket();

      socket.setTimeout(1000);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        socket.destroy();
        setTimeout(tryConnect, 500);
      });

      socket.on('timeout', () => {
        socket.destroy();
        setTimeout(tryConnect, 500);
      });

      socket.connect(port, host);
    };

    tryConnect();
  });
}

module.exports = async function () {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  // Wait up to 5 seconds for the server to be available
  const isServerRunning = await waitForPort(port, host, 5000);

  if (!isServerRunning) {
    console.log(`\n⚠️  API server is not running on ${host}:${port}`);
    console.log('   E2E tests require the API to be running.');
    console.log('   Run E2E tests with: npx nx e2e api-e2e');
    console.log('   Or start the API first: npx nx serve api\n');

    // Set a flag to skip tests
    process.env.SKIP_E2E_TESTS = 'true';
  } else {
    console.log(`✓ API server is running on ${host}:${port}\n`);
  }

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
