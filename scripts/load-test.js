/**
 * Veeramani Tracker - Load Testing Suite
 * Uses autocannon to benchmark the parody radar endpoints under concurrent traffic
 * Tests targets: p97.5 latency < 800ms, HTTP 5xx rate < 1%
 * Does NOT hit external tile providers.
 */

const autocannon = require('autocannon');

const TARGET_HOST = process.env.LOAD_TEST_URL || 'http://localhost:3000';

async function runBenchmark(name, options) {
  console.log(`\n==================================================`);
  console.log(`Starting benchmark: ${name}`);
  console.log(`URL: ${options.url}`);
  console.log(`Connections: ${options.connections}, Duration: ${options.duration}s`);
  console.log(`==================================================\n`);

  return new Promise((resolve, reject) => {
    autocannon(options, (err, result) => {
      if (err) return reject(err);

      const totalRequests = result.requests.total;
      const total2xx = result['2xx'];
      const total5xx = result['5xx'] || 0;
      const non2xx = result.non2xx || 0;
      const p97Latency = result.latency.p97_5 || result.latency.p90 || result.latency.p99;
      const p50Latency = result.latency.p50;
      const p99Latency = result.latency.p99;
      const avgLatency = result.latency.average;
      const errorRate = totalRequests > 0 ? (total5xx / totalRequests) * 100 : 0;

      console.log(`Results for ${name}:`);
      console.log(`- Total Requests:      ${totalRequests}`);
      console.log(`- 2xx Responses:       ${total2xx}`);
      console.log(`- Non-2xx Responses:   ${non2xx}`);
      console.log(`- 5xx Server Errors:   ${total5xx} (${errorRate.toFixed(2)}%)`);
      console.log(`- Median (p50) Latency:${p50Latency} ms`);
      console.log(`- p97.5 Latency:       ${p97Latency} ms (Target: < 800 ms)`);
      console.log(`- p99 Latency:         ${p99Latency} ms`);
      console.log(`- Average Latency:     ${avgLatency} ms`);
      console.log(`- Req/Sec:             ${result.requests.average}`);
      console.log(`- Throughput:          ${(result.throughput.average / 1024).toFixed(2)} KB/s`);

      const passedP95 = p97Latency <= 800;
      const passedErrorRate = errorRate < 1.0;

      console.log(`\nEngineering Quality Targets:`);
      console.log(`  [${passedP95 ? 'PASS' : 'FAIL'}] p97.5 Latency <= 800ms (${p97Latency}ms)`);
      console.log(`  [${passedErrorRate ? 'PASS' : 'FAIL'}] HTTP 5xx Rate < 1% (${errorRate.toFixed(2)}%)`);

      resolve({
        name,
        totalRequests,
        total2xx,
        total5xx,
        p50Latency,
        p97Latency,
        passedP95,
        passedErrorRate,
      });
    });
  });
}

async function runAllBenchmarks() {
  console.log(`\n🚀 VEERAMANI TRACKER - PERFORMANCE BENCHMARK`);
  console.log(`Connecting to: ${TARGET_HOST}`);

  try {
    // 1. Baseline Test: 10 concurrent virtual users querying parody radar
    await runBenchmark('Baseline Concurrency (10 Users) - /api/tracker-entries', {
      url: `${TARGET_HOST}/api/tracker-entries`,
      connections: 10,
      duration: 5,
    });

    // 2. Medium Concurrency: 50 concurrent virtual users querying district filter
    await runBenchmark('Medium Concurrency (50 Users) - District Filter', {
      url: `${TARGET_HOST}/api/tracker-entries?district=Chennai`,
      connections: 50,
      duration: 5,
    });

    // 3. Peak Burst Concurrency: 100 concurrent virtual users querying category
    await runBenchmark('Peak Burst Concurrency (100 Users) - Category Filter', {
      url: `${TARGET_HOST}/api/tracker-entries?category=cinematic_echo`,
      connections: 100,
      duration: 5,
    });

    console.log(`\n==================================================`);
    console.log(`🎉 ALL BENCHMARKS COMPLETED SUCCESSFULLY`);
    console.log(`==================================================\n`);
  } catch (error) {
    console.error('Benchmark execution error:', error.message);
    console.log('\nNote: Ensure the local server is running on http://localhost:3000 (npm run dev or npm start) before running the load test.');
    process.exit(1);
  }
}

if (require.main === module) {
  runAllBenchmarks();
}
