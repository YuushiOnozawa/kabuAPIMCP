import { spawn } from 'node:child_process';
import process from 'node:process';
import { createInterface } from 'node:readline';
import { clearTimeout, setTimeout } from 'node:timers';

const timeoutMs = 15_000;
const child = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let exited = false;
let exitEventReceived = false;
let terminationRequested = false;
let stderr = '';
const responseWaiters = new Map();
let resolveTermination;
const termination = new Promise((resolve) => {
  resolveTermination = resolve;
});

child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

child.stdin.on('error', (error) => {
  rejectPending(new Error(`failed to send request to MCP server: ${error.message}`));
});

child.on('error', (error) => {
  rejectPending(new Error(`failed to start MCP server: ${error.message}`));
});

child.on('exit', (code, signal) => {
  exitEventReceived = true;
  exited = true;
  resolveTermination({ code, signal });
  if (!terminationRequested) {
    rejectPending(
      new Error(
        `MCP server exited unexpectedly (code: ${code ?? 'null'}, signal: ${signal ?? 'null'})`,
      ),
    );
  }
});

child.on('close', (code, signal) => {
  if (exitEventReceived) {
    return;
  }

  exited = true;
  resolveTermination({ code, signal });
  if (!terminationRequested) {
    rejectPending(
      new Error(
        `MCP server closed unexpectedly (code: ${code ?? 'null'}, signal: ${signal ?? 'null'})`,
      ),
    );
  }
});

const lineReader = createInterface({ input: child.stdout });

lineReader.on('line', (line) => {
  if (!line.trim()) {
    return;
  }

  let response;
  try {
    response = JSON.parse(line);
  } catch {
    rejectPending(new Error('MCP server returned invalid JSON'));
    return;
  }

  if (typeof response.id !== 'number') {
    return;
  }

  const waiter = responseWaiters.get(response.id);
  if (!waiter) {
    return;
  }

  responseWaiters.delete(response.id);
  waiter.resolve(response);
});

function rejectPending(error) {
  for (const { reject } of responseWaiters.values()) {
    reject(error);
  }
  responseWaiters.clear();
}

function waitForResponse(id) {
  return new Promise((resolve, reject) => {
    if (exited) {
      reject(new Error('MCP server exited before responding'));
      return;
    }

    responseWaiters.set(id, { resolve, reject });
  });
}

function sendMessage(message) {
  if (exited) {
    throw new Error('MCP server exited before the request was sent');
  }

  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function ensureSuccessfulResponse(response, id) {
  if (response.error) {
    throw new Error(`MCP request ${id} failed: ${JSON.stringify(response.error)}`);
  }
}

async function runSmokeTest() {
  const initializeResponse = waitForResponse(1);
  sendMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'smoke-test', version: '1.0.0' },
    },
  });
  const initializeResult = await initializeResponse;
  ensureSuccessfulResponse(initializeResult, 1);

  sendMessage({
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {},
  });

  const toolsListResponse = waitForResponse(2);
  sendMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {},
  });
  const toolsListResult = await toolsListResponse;
  ensureSuccessfulResponse(toolsListResult, 2);

  const tools = toolsListResult.result?.tools;
  if (!Array.isArray(tools)) {
    throw new Error('tools/list response did not contain a result.tools array');
  }

  if (tools.length !== 25) {
    throw new Error(`expected 25 tools, received ${tools.length}`);
  }

  process.stdout.write('MCP server smoke test passed: 25 tools\n');
}

async function terminateChild() {
  if (!exited && !terminationRequested) {
    terminationRequested = true;
    try {
      child.kill();
    } catch {
      terminationRequested = true;
    }
  }

  if (!exited) {
    await termination;
  }

  lineReader.close();
}

let failure;
let timer;
try {
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`smoke test timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  await Promise.race([runSmokeTest(), timeout]);
} catch (error) {
  failure = error instanceof Error ? error : new Error(String(error));
} finally {
  clearTimeout(timer);
  await terminateChild();
}

if (failure) {
  const details = stderr.trim();
  process.stderr.write(details ? `${failure.message}\n${details}\n` : `${failure.message}\n`);
  process.exit(1);
}

process.exit(0);
