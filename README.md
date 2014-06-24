```
$ node benchmark.js

biginteger-add x 752 ops/sec ±4.50% (44 runs sampled)
BigInt-add x 458 ops/sec ±2.50% (71 runs sampled)
bn-add x 935 ops/sec ±4.80% (78 runs sampled)
Fastest is bn-add

biginteger-subtraction x 680 ops/sec ±3.46% (63 runs sampled)
BigInt-subtraction x 439 ops/sec ±2.73% (73 runs sampled)
bn-subtraction x 539 ops/sec ±3.12% (75 runs sampled)
Fastest is biginteger-subtraction

biginteger-multiplication x 52.25 ops/sec ±1.54% (68 runs sampled)
BigInt-multiplication x 43.46 ops/sec ±1.48% (58 runs sampled)
bn-multiplication x 109 ops/sec ±1.29% (74 runs sampled)
Fastest is bn-multiplication

biginteger-division x 57.32 ops/sec ±3.44% (63 runs sampled)
BigInt-division x 114 ops/sec ±18.94% (72 runs sampled)
bn-division x 12.56 ops/sec ±2.34% (36 runs sampled)
Fastest is BigInt-division

