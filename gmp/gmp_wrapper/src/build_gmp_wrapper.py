#!/usr/bin/env python

import os
import re

emcc = 'emcc'
source = 'gmp_wrapper.c'
target = 'gmp_wrapper.js'

with open(source, 'r') as f:
    src = f.read()
    exports = map(lambda s: '_' + s, re.findall('extern\s+\S+\s+(\w+)\(', src))

command = '{} -O2 {} .libs/libgmp.a -o {} -s EXPORTED_FUNCTIONS="{}"'.format(
    emcc, source, target, repr(exports))

print command
os.system(command)

