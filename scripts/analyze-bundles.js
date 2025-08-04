#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Analyze bundle sizes and look for polyfill indicators
function analyzeBundles() {
  const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');

  if (!fs.existsSync(chunksDir)) {
    console.log('❌ No chunks directory found. Run "yarn build" first.');
    return;
  }

  const files = fs.readdirSync(chunksDir).filter(file => file.endsWith('.js'));

  console.log('📊 Bundle Analysis Results:\n');

  let totalSize = 0;
  const bundleAnalysis = [];

  files.forEach(file => {
    const filePath = path.join(chunksDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    totalSize += stats.size;

    // Read file content to check for polyfill indicators
    const content = fs.readFileSync(filePath, 'utf8');
    const polyfillIndicators = {
      babelTransform: content.includes('@babel/plugin-transform'),
      arrayPolyfills:
        content.includes('Array.prototype.') &&
        (content.includes('.at') || content.includes('.flat') || content.includes('.flatMap')),
      objectPolyfills: content.includes('Object.fromEntries') || content.includes('Object.hasOwn'),
      stringPolyfills:
        content.includes('String.prototype.trimEnd') ||
        content.includes('String.prototype.trimStart'),
      classPolyfills: content.includes('classCallCheck') || content.includes('_classCallCheck'),
      spreadPolyfills: content.includes('_toConsumableArray') || content.includes('_slicedToArray')
    };

    const polyfillCount = Object.values(polyfillIndicators).filter(Boolean).length;

    bundleAnalysis.push({
      file,
      sizeKB,
      polyfillCount,
      indicators: polyfillIndicators
    });
  });

  // Sort by size
  bundleAnalysis.sort((a, b) => parseFloat(b.sizeKB) - parseFloat(a.sizeKB));

  console.log('📦 Bundle Sizes:');
  bundleAnalysis.forEach(({ file, sizeKB, polyfillCount }) => {
    const status = polyfillCount > 0 ? `⚠️  (${polyfillCount} polyfill indicators)` : '✅ (clean)';
    console.log(`  ${file}: ${sizeKB} KB ${status}`);
  });

  console.log(`\n📈 Total Bundle Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  const totalPolyfills = bundleAnalysis.reduce((sum, bundle) => sum + bundle.polyfillCount, 0);
  console.log(`🔧 Total Polyfill Indicators: ${totalPolyfills}`);

  // Detailed polyfill analysis
  console.log('\n🔍 Detailed Polyfill Analysis:');
  bundleAnalysis
    .filter(bundle => bundle.polyfillCount > 0)
    .forEach(({ file, indicators }) => {
      console.log(`\n  ${file}:`);
      Object.entries(indicators).forEach(([key, hasPolyfill]) => {
        if (hasPolyfill) {
          console.log(`    - ${key}`);
        }
      });
    });

  if (totalPolyfills === 0) {
    console.log('\n🎉 No polyfill indicators found! Optimizations appear successful.');
  } else {
    console.log('\n💡 Some polyfills remain. Consider:');
    console.log('   - Checking if dependencies still include polyfills');
    console.log('   - Running Lighthouse to verify improvements');
    console.log('   - Using bundle analyzer for detailed analysis');
  }
}

analyzeBundles();
