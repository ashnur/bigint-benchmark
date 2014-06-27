```
$ node benchmark.js

biginteger-add x 698 ops/sec ±5.11% (73 runs sampled)
BigInt-add x 443 ops/sec ±2.78% (67 runs sampled)
bn-add x 889 ops/sec ±4.91% (74 runs sampled)
mathjs-add x 226 ops/sec ±3.24% (77 runs sampled)
asmbn-add x 30.05 ops/sec ±2.26% (54 runs sampled)
Fastest is bn-add

biginteger-subtraction x 652 ops/sec ±4.16% (66 runs sampled)
BigInt-subtraction x 432 ops/sec ±3.24% (73 runs sampled)
bn-subtraction x 543 ops/sec ±3.15% (57 runs sampled)
mathjs-subtraction x 228 ops/sec ±3.93% (78 runs sampled)
asmbn-add x 31.60 ops/sec ±3.33% (56 runs sampled)
Fastest is biginteger-subtraction

biginteger-multiplication x 76.41 ops/sec ±3.04% (68 runs sampled)
BigInt-multiplication x 55.41 ops/sec ±3.18% (59 runs sampled)
bn-multiplication x 144 ops/sec ±2.42% (76 runs sampled)
mathjs-multiplication x 67.60 ops/sec ±2.33% (71 runs sampled)
asmbn-multiplication x 15.58 ops/sec ±1.63% (43 runs sampled)
Fastest is bn-multiplication

biginteger-division x 60.53 ops/sec ±6.60% (66 runs sampled)
BigInt-division x 124 ops/sec ±12.40% (86 runs sampled)
bn-division x 14.89 ops/sec ±4.32% (42 runs sampled)
mathjs-division x 39.84 ops/sec ±0.99% (54 runs sampled)
asmbn-division x 17.19 ops/sec ±3.70% (47 runs sampled)
Fastest is BigInt-division
