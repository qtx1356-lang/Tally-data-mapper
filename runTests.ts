import { runPhase32HTestSuite } from './src/tests/phase32HOperationalSafetyTests';
import { runPhase32GTestSuite } from './src/tests/phase32GQueryTests';
import { runPhase32IReportingTests } from './src/tests/phase32IReportingTests';

async function main() {
  console.log('Running Phase 32G Suite...');
  const resG = await runPhase32GTestSuite();
  console.log('Phase 32G Results:', JSON.stringify(resG, null, 2));

  console.log('Running Phase 32H Suite...');
  const resH = await runPhase32HTestSuite();
  console.log('Phase 32H Results:', JSON.stringify(resH, null, 2));

  console.log('Running Phase 32I Suite...');
  const resI = await runPhase32IReportingTests();
  console.log('Phase 32I Results:', JSON.stringify(resI, null, 2));
}

main().catch((err) => {
  console.error('Error running test suite:', err);
  process.exit(1);
});
