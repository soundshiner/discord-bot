#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log (message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand (command, description) {
  log(`\n${colors.cyan}${description}...${colors.reset}`);
  try {
    execSync(command, {
      cwd: projectRoot,
      stdio: 'inherit',
      encoding: 'utf8'
    });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch {
    // Intentionally empty: error handled silently
  }
}

function runTestSuite (suiteName, command, description) {
  log(`\n${colors.magenta}=== Running ${suiteName} ===${colors.reset}`);
  return runCommand(command, description);
}

async function main () {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';

  log(`${colors.bright}🧪 SoundShine Bot Test Runner${colors.reset}`, 'cyan');
  log(`Running tests: ${testType}`, 'yellow');

  const results = {
    lint: false,
    unit: false,
    integration: false,
    performance: false,
    stress: false,
    coverage: false
  };

  try {
    // Toujours exécuter le linting en premier
    if (testType === 'all' || testType === 'lint') {
      results.lint = runTestSuite('Linting', 'npm run lint', 'ESLint check');
    }

    // Tests unitaires
    if (testType === 'all' || testType === 'unit') {
      results.unit = runTestSuite('Unit Tests', 'npm test', 'Unit tests');
    }

    // Tests d'intégration
    if (testType === 'all' || testType === 'integration') {
      results.integration = runTestSuite(
        'Integration Tests',
        'npm test tests/integration/',
        'Integration tests'
      );
    }

    // Tests de performance
    if (testType === 'all' || testType === 'performance') {
      results.performance = runTestSuite(
        'Performance Tests',
        'npm test tests/performance/',
        'Performance tests'
      );
    }

    // Tests de stress
    if (testType === 'all' || testType === 'stress') {
      results.stress = runTestSuite(
        'Stress Tests',
        'npm test tests/stress/',
        'Stress tests'
      );
    }

    // Tests de couverture
    if (testType === 'all' || testType === 'coverage') {
      results.coverage = runTestSuite(
        'Coverage Tests',
        'npm run test:coverage',
        'Coverage tests'
      );
    }

    // Vérification du formatage
    if (testType === 'all' || testType === 'format') {
      runTestSuite(
        'Format Check',
        'npm run format:check',
        'Code formatting check'
      );
    }

    // Résumé des résultats
    log(`\n${colors.bright}📊 Test Results Summary:${colors.reset}`, 'cyan');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;

    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const color = passed ? 'green' : 'red';
      log(`${status} ${test}`, color);
    });

    log(
      `\n${colors.bright}Overall: ${passedTests}/${totalTests} test suites passed${colors.reset}`,
      passedTests === totalTests ? 'green' : 'red'
    );

    if (passedTests === totalTests) {
      log('\n🎉 All tests passed! Your bot is ready for deployment.', 'green');
      process.exit(0);
    } else {
      log(
        '\n⚠️  Some tests failed. Please fix the issues before deploying.',
        'yellow'
      );
      process.exit(1);
    }
  } catch (error) {
    log(`\n💥 Test runner encountered an error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', () => {
  log('\n\n🛑 Test runner interrupted by user', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n\n🛑 Test runner terminated', 'yellow');
  process.exit(1);
});

// Afficher l'aide si demandé
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`${colors.bright}SoundShine Bot Test Runner${colors.reset}`, 'cyan');
  log('\nUsage: node scripts/run-tests.js [test-type]', 'yellow');
  log('\nAvailable test types:', 'yellow');
  log('  all          - Run all tests (default)', 'reset');
  log('  lint         - Run ESLint only', 'reset');
  log('  unit         - Run unit tests only', 'reset');
  log('  integration  - Run integration tests only', 'reset');
  log('  performance  - Run performance tests only', 'reset');
  log('  stress       - Run stress tests only', 'reset');
  log('  coverage     - Run coverage tests only', 'reset');
  log('  format       - Check code formatting only', 'reset');
  log('\nExamples:', 'yellow');
  log('  node scripts/run-tests.js', 'reset');
  log('  node scripts/run-tests.js unit', 'reset');
  log('  node scripts/run-tests.js integration', 'reset');
  process.exit(0);
}

// Démarrer les tests
main().catch((error) => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

