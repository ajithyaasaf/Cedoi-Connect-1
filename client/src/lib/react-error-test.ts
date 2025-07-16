/**
 * React Error Prevention Test Suite
 * Tests all potential sources of "Objects are not valid as a React child" errors
 */

import { validateReactChild } from './react-error-prevention';

export function runReactErrorTests() {
  console.log('🔍 Running React Error Prevention Tests...');
  
  const tests = [
    {
      name: 'Null values',
      input: null,
      expected: null
    },
    {
      name: 'Undefined values',
      input: undefined,
      expected: null
    },
    {
      name: 'String values',
      input: 'Hello World',
      expected: 'Hello World'
    },
    {
      name: 'Number values',
      input: 42,
      expected: 42
    },
    {
      name: 'Boolean values',
      input: true,
      expected: true
    },
    {
      name: 'Array values',
      input: ['a', 'b', 'c'],
      expected: ['a', 'b', 'c']
    },
    {
      name: 'Object values',
      input: { key: 'value' },
      expected: '{"key":"value"}'
    },
    {
      name: 'Date objects',
      input: new Date('2024-01-01'),
      expected: '2024-01-01T00:00:00.000Z'
    },
    {
      name: 'Error objects',
      input: new Error('Test error'),
      expected: 'Test error'
    },
    {
      name: 'Function values',
      input: () => 'test',
      expected: '[Function]'
    },
    {
      name: 'Complex nested objects',
      input: { user: { name: 'John', age: 30 }, items: [1, 2, 3] },
      expected: '{"user":{"name":"John","age":30},"items":[1,2,3]}'
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    try {
      const result = validateReactChild(test.input);
      if (JSON.stringify(result) === JSON.stringify(test.expected)) {
        console.log(`✅ ${test.name}: PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Expected: ${JSON.stringify(test.expected)}`);
        console.log(`   Got: ${JSON.stringify(result)}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error}`);
      failed++;
    }
  });

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All React error prevention tests passed!');
  } else {
    console.log('⚠️  Some tests failed - React errors may still occur');
  }
  
  return { passed, failed };
}

// Run tests automatically in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    runReactErrorTests();
  }, 1000);
}