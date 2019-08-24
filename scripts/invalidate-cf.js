const CloudFront = require('aws-sdk').CloudFront;
const cloudfront = new CloudFront();

// Evergreen paths to invalidate.
const paths = [
  '/crank-darwin-x64.tar.gz', '/crank-darwin-x64.tar.xz',
  '/crank-linux-arm.tar.gz', '/crank-linux-arm.tar.xz',
  '/crank-linux-x64.tar.gz', '/crank-linux-x64.tar.xz',
  '/crank-win32-x64.tar.gz', '/crank-win32-x64.tar.xz',
  '/crank-win32-x86.tar.gz', '/crank-win32-x86.tar.xz',
  '/crank-x64.exe', '/crank-x86.exe',
  '/crank.tar.gz', '/crank.tar.xz',
  '/crank.pkg',
  '/darwin-x64', '/linux-arm', '/linux-x64', '/version', '/win32-x64', '/win32-x86'
];

// An absurd API request body...
const invalidation = {
  DistributionId: 'E2QTABTD83AOC8',
  InvalidationBatch: {
    CallerReference: Date.now().toString(),
    Paths: {
      Quantity: paths.length,
      Items: paths,
    },
  },
};

cloudfront.createInvalidation(invalidation, (err, data) => {
  if (err) {
    console.error(err, err.stack);
    process.exitCode = 1;
  } else {
    console.log(data);
  }
});
