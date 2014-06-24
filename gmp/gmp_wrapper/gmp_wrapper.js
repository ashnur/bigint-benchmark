// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr', 
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0
}
Module['stringToUTF32'] = stringToUTF32;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_toFloat32 = Math.toFloat32;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 7864;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([144,1,0,0,32,3,0,0,64,6,0,0,128,12,0,0,128,37,0,0,128,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,1,0,0,192,3,0,0,128,7,0,0,0,15,0,0,0,45,0,0,0,135,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,47,104,111,109,101,47,108,101,118,105,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,109,117,95,100,105,118,95,113,114,46,99,0,0,0,0,110,108,32,61,61,32,48,0,71,78,85,32,77,80,58,32,67,97,110,110,111,116,32,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,32,40,115,105,122,101,61,37,108,117,41,10,0,0,0,0,0,0,110,112,114,105,109,101,50,32,60,32,110,0,0,0,0,0,40,110,32,38,32,40,75,50,32,45,32,49,41,41,32,61,61,32,48,0,0,0,0,0,37,115,58,0,0,0,0,0,114,110,32,61,61,32,100,110,0,0,0,0,0,0,0,0,99,120,32,62,61,32,99,121,0,0,0,0,0,0,0,0,47,104,111,109,101,47,108,101,118,105,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,116,100,105,118,95,113,114,46,99,0,0,0,0,0,0,71,78,85,32,77,80,32,97,115,115,101,114,116,105,111,110,32,102,97,105,108,101,100,58,32,37,115,10,0,0,0,0,110,50,112,91,113,110,93,32,62,61,32,99,121,50,0,0,110,112,114,105,109,101,32,60,32,112,108,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,0,0,0,0,47,104,111,109,101,47,108,101,118,105,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,115,101,116,95,115,116,114,46,99,0,0,0,0,0,0,47,104,111,109,101,47,108,101,118,105,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,115,98,112,105,49,95,100,105,118,97,112,112,114,95,113,46,99,0,0,0,0,0,0,47,104,111,109,101,47,108,101,118,105,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,109,117,108,95,102,102,116,46,99,0,0,0,0,0,0,99,121,32,61,61,32,48,0,103,109,112,58,32,111,118,101,114,102,108,111,119,32,105,110,32,109,112,122,32,116,121,112,101,10,0,0,0,0,0,0,47,104,111,109,101,47,108,101,118,105,47,103,109,112,45,54,46,48,46,48,47,109,112,110,47,103,101,110,101,114,105,99,47,103,101,116,95,115,116,114,46,99,0,0,0,0,0,0,71,78,85,32,77,80,58,32,67,97,110,110,111,116,32,114,101,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,32,40,111,108,100,95,115,105,122,101,61,37,108,117,32,110,101,119,95,115,105,122,101,61,37,108,117,41,10,0,0,0,37,100,58,32,0,0,0,0,113,120,110,32,61,61,32,48,0,0,0,0,0,0,0,0,112,111,119,116,97,98,95,109,101,109,95,112,116,114,32,60,32,112,111,119,116,97,98,95,109,101,109,32,43,32,40,40,117,110,41,32,43,32,51,50,41,0,0,0,0,0,0,0,110,112,91,49,93,32,61,61,32,110,49,0,0,0,0,0,95,95,103,109,112,110,95,102,102,116,95,110,101,120,116,95,115,105,122,101,32,40,112,108,44,32,107,41,32,61,61,32,112,108,0,0,0,0,0,0,112,111,119,116,97,98,95,109,101,109,95,112,116,114,32,60,32,112,111,119,116,97,98,95,109,101,109,32,43,32,40,40,117,110,41,32,43,32,50,32,42,32,51,50,41,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,0,0,1,2,3,3,4,4,4,4,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,255,255,255,255,255,255,255,31,1,0,0,0,0,0,0,0,20,0,0,0,193,156,132,161,71,3,184,50,145,27,212,207,36,60,86,59,16,0,0,0,255,255,255,127,255,255,255,63,2,0,0,0,0,0,0,0,13,0,0,0,164,209,64,110,37,60,77,74,149,115,194,72,132,38,92,194,12,0,0,0,27,201,8,99,71,3,184,82,0,16,191,129,182,209,27,249,11,0,0,0,235,100,48,91,253,217,213,89,151,156,219,117,203,162,7,22,10,0,0,0,85,85,85,85,255,255,255,95,3,0,0,0,0,0,0,0,10,0,0,0,96,78,194,80,142,6,112,101,145,27,212,207,36,60,86,59,9,0,0,0,66,77,16,77,37,60,77,106,0,202,154,59,130,190,224,18,9,0,0,0,7,39,0,74,240,169,179,110,43,109,139,140,4,222,76,210,8,0,0,0,13,206,104,71,71,3,184,114,0,0,161,25,181,154,163,63,8,0,0,0,227,83,46,69,142,0,106,118,33,16,159,48,95,172,248,80,8,0,0,0,251,255,60,67,253,217,213,121,0,193,246,87,30,59,132,116,8,0,0,0,17,119,134,65,109,63,5,125,129,155,194,152,194,38,3,173,8,0,0,0,255,255,255,63,255,255,255,127,4,0,0,0,0,0,0,0,7,0,0,0,253,106,161,62,223,126,204,130,113,69,117,24,189,182,240,78,7,0,0,0,141,89,100,61,142,6,112,133,128,188,125,36,161,72,252,192,7,0,0,0,48,194,67,60,174,5,239,135,123,102,71,53,66,137,131,51,7,0,0,0,66,154,59,59,37,60,77,138,0,64,75,76,171,41,127,173,7,0,0,0,240,152,72,58,68,221,141,140,29,110,90,107,21,61,60,49,7,0,0,0,19,11,104,57,240,169,179,142,128,225,172,148,224,169,204,184,7,0,0,0,183,178,151,56,0,5,193,144,103,131,241,202,233,109,237,66,6,0,0,0,209,174,213,55,71,3,184,146,0,0,100,11,11,14,152,103,6,0,0,0,210,104,32,55,75,120,154,148,81,74,141,14,18,152,121,25,6,0,0,0,126,134,118,54,142,0,106,150,64,174,105,18,150,83,232,188,6,0,0,0,235,222,214,53,213,9,40,152,73,145,23,23,169,3,193,98,6,0,0,0,214,113,64,53,253,217,213,153,0,16,185,28,67,61,53,29,6,0,0,0,197,96,178,52,143,148,116,155,153,72,116,35,234,236,29,206,6,0,0,0,134,233,43,52,109,63,5,157,64,168,115,43,17,197,15,121,6,0,0,0,185,97,172,51,179,198,136,158,65,59,230,52,160,101,184,53,6,0,0,0,51,51,51,51,255,255,255,159,5,0,0,0,0,0,0,0,6,0,0,0,1,217,191,50,55,173,107,161,193,60,250,76,179,209,174,169,6,0,0,0,246,220,81,50,223,126,204,162,64,216,19,92,41,194,223,99,6,0,0,0,159,213,232,49,35,22,35,164,25,181,145,109,48,238,15,43,6,0,0,0,141,100,132,49,142,6,112,165,0,16,191,129,182,209,27,249,6,0,0,0,232,52,36,49,139,215,179,166,201,224,237,152,169,195,137,172,6,0,0,0,52,250,199,48,174,5,239,167,64,62,119,179,254,50,44,109,6,0,0,0,76,111,111,48,213,3,34,169,209,196,187,209,201,7,121,56,6,0,0,0,127,85,26,48,37,60,77,170,0,0,36,244,11,122,111,12,5,0,0,0,209,115,200,47,230,16,113,171,73,211,231,6,84,129,146,40,5,0,0,0,82,150,121,47,68,221,141,172,160,48,202,7,157,98,232,6,5,0,0,0,143,141,45,47,251,245,163,173,187,43,195,8,160,220,115,211,5,0,0,0,22,46,228,46,240,169,179,174,0,108,212,9,149,120,177,160,5,0,0,0,9,80,157,46,180,66,189,175,253,172,255,10,165,17,104,116,5,0,0,0,192,206,88,46,0,5,193,176,224,190,70,12,15,80,166,77,5,0,0,0,116,136,22,46,30,49,191,177,239,134,171,13,130,53,162,43,5,0,0,0,247,93,214,45,71,3,184,178,0,0,48,15,136,10,178,13,5,0,0,0,117,50,152,45,250,179,171,179,241,58,214,16,228,92,141,230,5,0,0,0,56,235,91,45,75,120,154,180,32,95,160,18,157,253,205,183,5,0,0,0,121,111,33,45,38,130,132,181,227,170,144,20,51,57,88,142,5,0,0,0,46,168,232,44,142,0,106,182,0,116,169,22,234,195,124,105,5,0,0,0,234,127,177,44,214,31,75,183,37,40,237,24,108,202,165,72,5,0,0,0,176,226,123,44,213,9,40,184,96,77,94,27,22,219,82,43,5,0,0,0,219,189,71,44,21,230,0,185,151,130,255,29,166,134,21,17,5,0,0,0,252,255,20,44,253,217,213,185,0,128,211,32,54,43,29,243,5,0,0,0,195,152,227,43,245,8,167,186,153,23,221,35,25,109,215,200,5,0,0,0,231,120,179,43,143,148,116,187,160,53,31,39,180,30,203,162,5,0,0,0,16,146,132,43,162,156,62,188,11,225,156,42,195,62,124,128,5,0,0,0,199,214,86,43,109,63,5,189,0,60,89,46,191,200,126,97,5,0,0,0,96,58,42,43,171,153,200,189,77,132,87,50,190,108,116,69,5,0,0,0,241,176,254,42,179,198,136,190,224,19,155,54,115,162,10,44,5,0,0,0,60,47,212,42,139,224,69,191,63,97,39,59,5,8,249,20,5,0,0,0,170,170,170,42,255,255,255,191,6,0,0,0,0,0,0,0,5,0,0,0,58,25,130,42,180,60,183,192,65,161,40,69,41,8,207,217,5,0,0,0,118,113,90,42,55,173,107,193,32,20,165,74,65,72,252,182,5,0,0,0,110,170,51,42,19,103,29,194,51,70,121,80,203,84,48,151,5,0,0,0,170,187,13,42,223,126,204,194,0,68,169,86,75,190,29,122,5,0,0,0,36,157,232,41,72,8,121,195,117,57,57,93,127,205,127,95,5,0,0,0,64,71,196,41,35,22,35,196,96,114,45,100,132,108,25,71,5,0,0,0,199,178,160,41,120,186,202,196,231,90,138,107,53,54,180,48,5,0,0,0,219,216,125,41,142,6,112,197,0,128,84,115,246,165,31,28,5,0,0,0,249,178,91,41,244,10,19,198,233,143,144,123,74,99,48,9,5,0,0,0,235,58,58,41,139,215,179,198,160,90,67,132,60,74,127,239,5,0,0,0,204,106,25,41,147,123,82,199,91,210,113,141,210,82,85,207,5,0,0,0,251,60,249,40,174,5,239,199,0,12,33,151,142,124,164,177,5,0,0,0,27,172,217,40,237,131,137,200,157,63,86,161,62,180,52,150,5,0,0,0,16,179,186,40,213,3,34,201,224,200,22,172,125,129,211,124,5,0,0,0,248,76,156,40,103,146,184,201,143,39,104,183,97,103,83,101,5,0,0,0,41,117,126,40,37,60,77,202,0,0,80,195,142,88,139,79,5,0,0,0,48,39,97,40,28,13,224,202,145,27,212,207,36,60,86,59,5,0,0,0,201,94,68,40,230,16,113,203,32,105,250,220,84,129,146,40,5,0,0,0,225,23,40,40,177,82,0,204,131,253,200,234,176,191,33,23,5,0,0,0,144,78,12,40,68,221,141,204,0,20,70,249,157,98,232,6,4,0,0,0,27,255,240,39,5,187,25,205,177,132,28,3,124,193,28,73,4,0,0,0,236,37,214,39,251,245,163,205,16,171,66,3,59,216,17,58,4,0,0,0,149,191,187,39,214,151,44,206,33,44,106,3,205,116,224,43,4,0,0,0,200,200,161,39,240,169,179,206,0,16,147,3,231,2,122,30,4,0,0,0,94,62,136,39,80,53,57,207,225,94,189,3,221,14,209,17,4,0,0,0,76,29,111,39,180,66,189,207,16,33,233,3,104,44,217,5,4,0,0,0,168,98,86,39,139,218,63,208,241,94,22,4,178,191,13,245,4,0,0,0,163,11,62,39,0,5,193,208,0,33,69,4,22,19,159,223,4,0,0,0,140,21,38,39,250,201,64,209,209,111,117,4,132,166,82,203,4,0,0,0,201,125,14,39,30,49,191,209,16,84,167,4,151,62,22,184,4,0,0,0,221,65,247,38,212,65,60,210,129,214,218,4,105,242,216,165,4,0,0,0,95,95,224,38,71,3,184,210,0,0,16,5,205,15,139,148,4,0,0,0,254,211,201,38,106,124,50,211,129,217,70,5,21,2,30,132,4,0,0,0,127,157,179,38,250,179,171,211,16,108,127,5,30,59,132,116,4,0,0,0,188,185,157,38,126,176,35,212,209,192,185,5,110,30,177,101,4,0,0,0,161,38,136,38,75,120,154,212,0,225,245,5,35,238,152,87,4,0,0,0,45,226,114,38,135,17,16,213,241,213,51,6,155,185,48,74,4,0,0,0,114,234,93,38,38,130,132,213,16,169,115,6,148,77,110,61,4,0,0,0,147,61,73,38,244,207,247,213,225,99,181,6,176,37,72,49,4,0,0,0,194,217,52,38,142,0,106,214,0,16,249,6,46,95,181,37,4,0,0,0,65,189,32,38,106,25,219,214,33,183,62,7,203,172,173,26,4,0,0,0,98,230,12,38,214,31,75,215,16,99,134,7,162,75,41,16,4,0,0,0,133,83,249,37,249,24,186,215,177,29,208,7,246,248,32,6,4,0,0,0,22,3,230,37,213,9,40,216,0,241,27,8,182,209,27,249,4,0,0,0,144,243,210,37,75,247,148,216,17,231,105,8,42,123,211,230,4,0,0,0,121,35,192,37,21,230,0,217,16,10,186,8,110,255,92,213,4,0,0,0,101,145,173,37,210,218,107,217,65,100,12,9,178,45,173,196,4,0,0,0,243,59,155,37,253,217,213,217,0,0,97,9,207,133,185,180,4,0,0,0,203,33,137,37,243,231,62,218,193,231,183,9,239,43,120,165,4,0,0,0,162,65,119,37,245,8,167,218,16,38,17,10,42,221,223,150,4,0,0,0,55,154,101,37,38,65,14,219,145,197,108,10,9,229,231,136,4,0,0,0,80,42,84,37,143,148,116,219,0,209,202,10,211,19,136,123,4,0,0,0,194,240,66,37,28,7,218,219,49,83,43,11,149,181,184,110,4,0,0,0,100,236,49,37,162,156,62,220,16,87,142,11,219,137,114,98,4,0,0,0,28,28,33,37,220,88,162,220,161,231,243,11,7,188,174,86,4,0,0,0,213,126,16,37,109,63,5,221,0,16,92,12,51,220,102,75,4,0,0,0,131,19,0,37,224,83,103,221,97,219,198,12,163,216,148,64,4,0,0,0,33,217,239,36,171,153,200,221,16,85,52,13,165,247,50,54,4,0,0,0,179,206,223,36,46,20,41,222,113,136,164,13,240,209,59,44,4,0,0,0,67,243,207,36,179,198,136,222,0,129,23,14,95,77,170,34,4,0,0,0,225,69,192,36,113,180,231,222,81,74,141,14,18,152,121,25,4,0,0,0,166,197,176,36,139,224,69,223,16,240,5,15,229,35,165,16,4,0,0,0,176,113,161,36,17,78,163,223,1,126,129,15,55,162,40,8,4,0,0,0,36,73,146,36,255,255,255,223,7,0,0,0,0,0,0,0,4,0,0,0,44,75,131,36,66,249,91,224,1,130,129,16,82,196,78,240,4,0,0,0,249,118,116,36,180,60,183,224,16,16,6,17,74,68,54,225,4,0,0,0,192,203,101,36,29,205,17,225,81,182,141,17,137,149,175,210,4,0,0,0,188,72,87,36,55,173,107,225,0,129,24,18,131,42,180,196,4,0,0,0,47,237,72,36,171,223,196,225,113,124,166,18,245,204,61,183,4,0,0,0,93,184,58,36,19,103,29,226,16,181,55,19,197,152,70,170,4,0,0,0,146,169,44,36,251,69,117,226,97,55,204,19,41,247,200,157,4,0,0,0,27,192,30,36,223,126,204,226,0,16,100,20,48,154,191,145,4,0,0,0,77,251,16,36,45,20,35,227,161,75,255,20,135,120,37,134,4,0,0,0,128,90,3,36,72,8,121,227,16,247,157,21,140,201,245,122,4,0,0,0,16,221,245,35,130,93,206,227,49,31,64,22,160,1,44,112,4,0,0,0,93,130,232,35,35,22,35,228,0,209,229,22,177,206,195,101,4,0,0,0,204,73,219,35,101,52,119,228,145,25,143,23,2,21,185,91,4,0,0,0,196,50,206,35,120,186,202,228,16,6,60,24,35,236,7,82,4,0,0,0,179,60,193,35,126,170,29,229,193,163,236,24,25,156,172,72,4,0,0,0,6,103,180,35,142,6,112,229,0,0,161,25,181,154,163,63,4,0,0,0,50,177,167,35,181,208,193,229,65,40,89,26,18,137,233,54,4,0,0,0,172,26,155,35,244,10,19,230,16,42,21,27,64,49,123,46,4,0,0,0,239,162,142,35,65,183,99,230,17,19,213,27,11,132,85,38,4,0,0,0,118,73,130,35,139,215,179,230,0,241,152,28,234,150,117,30,4,0,0,0,195,13,118,35,179,109,3,231,177,209,96,29,13,162,216,22,4,0,0,0,88,239,105,35,147,123,82,231,16,195,44,30,135,254,123,15,4,0,0,0,187,237,93,35,249,2,161,231,33,211,252,30,146,36,93,8,4,0,0,0,116,8,82,35,174,5,239,231,0,16,209,31,244,169,121,1,4,0,0,0,16,63,70,35,109,133,60,232,225,135,169,32,235,128,158,245,4,0,0,0,27,145,58,35,237,131,137,232,16,73,134,33,219,104,183,232,4,0,0,0,38,254,46,35,217,2,214,232,241,97,103,34,213,214,57,220,4,0,0,0,198,133,35,35,213,3,34,233,0,225,76,35,209,197,33,208,4,0,0,0,142,39,24,35,126,136,109,233,209,212,54,36,55,94,107,196,4,0,0,0,24,227,12,35,103,146,184,233,16,76,37,37,156,243,18,185,4,0,0,0,253,183,1,35,29,35,3,234,129,85,24,38,148,2,21,174,4,0,0,0,217,165,246,34,37,60,77,234,0,0,16,39,177,46,110,163,4,0,0,0,76,172,235,34,254,222,150,234,129,90,12,40,148,64,27,153,4,0,0,0,246,202,224,34,28,13,224,234,16,116,13,41,30,36,25,143,4,0,0,0,121,1,214,34,242,199,40,235,209,91,19,42,183,230,100,133,4,0,0,0,122,79,203,34,230,16,113,235,0,33,30,43,180,181,251,123,4,0,0,0,161,180,192,34,93,233,184,235,241,210,45,44,200,220,218,114,4,0,0,0,149,48,182,34,177,82,0,236,16,129,66,45,152,196,255,105,4,0,0,0,0,195,171,34,57,78,71,236,225,58,92,46,84,241,103,97,4,0,0,0,144,107,161,34,68,221,141,236,0,16,123,47,110,1,17,89,4,0,0,0,241,41,151,34,28,1,212,236,33,16,159,48,95,172,248,80,4,0,0,0,212,253,140,34,5,187,25,237,16,75,200,49,124,193,28,73,4,0,0,0,233,230,130,34,60,12,95,237,177,208,246,50,216,38,123,65,4,0,0,0,227,228,120,34,251,245,163,237,0,177,42,52,59,216,17,58,4,0,0,0,119,247,110,34,116,121,232,237,17,252,99,53,34,230,222,50,4,0,0,0,90,30,101,34,214,151,44,238,16,194,162,54,205,116,224,43,4,0,0,0,68,89,91,34,73,82,112,238,65,19,231,55,88,187,20,37,4,0,0,0,238,167,81,34,240,169,179,238,0,0,49,57,231,2,122,30,4,0,0,0,17,10,72,34,234,159,246,238,193,152,128,58,208,165,14,24,4,0,0,0,105,127,62,34,80,53,57,239,16,238,213,59,221,14,209,17,4,0,0,0,180,7,53,34,57,107,123,239,145,16,49,61,142,184,191,11,4,0,0,0,175,162,43,34,180,66,189,239,0,17,146,62,104,44,217,5,4,0,0,0,25,80,34,34,205,188,254,239,49,0,249,63,76,2,28,0,4,0,0,0,180,15,25,34,139,218,63,240,16,239,101,65,178,191,13,245,4,0,0,0,65,225,15,34,242,156,128,240,161,238,216,66,163,239,48,234,4,0,0,0,131,196,6,34,0,5,193,240,0,16,82,68,22,19,159,223,4,0,0,0,63,185,253,33,177,19,1,241,97,100,209,69,201,192,85,213,4,0,0,0,58,191,244,33,250,201,64,241,16,253,86,71,132,166,82,203,4,0,0,0,57,214,235,33,207,40,128,241,113,235,226,72,31,136,147,193,4,0,0,0,6,254,226,33,30,49,191,241,0,65,117,74,151,62,22,184,4,0,0,0,103,54,218,33,211,227,253,241,81,15,14,76,36,183,216,174,4,0,0,0,40,127,209,33,212,65,60,242,16,104,173,77,105,242,216,165,4,0,0,0,17,216,200,33,5,76,122,242,1,93,83,79,157,3,21,157,4,0,0,0,239,64,192,33,71,3,184,242,0,0,0,81,205,15,139,148,4,0,0,0,143,185,183,33,117,104,245,242,1,99,179,82,29,77,57,140,4,0,0,0,188,65,175,33,106,124,50,243,16,152,109,84,21,2,30,132,4,0,0,0,71,217,166,33,251,63,111,243,81,177,46,86,248,132,55,124,4,0,0,0,253,127,158,33,250,179,171,243,0,193,246,87,30,59,132,116,4,0,0,0,175,53,150,33,55,217,231,243,113,217,197,89,93,152,2,109,4,0,0,0,46,250,141,33,126,176,35,244,16,13,156,91,110,30,177,101,4,0,0,0,76,205,133,33,152,58,95,244,97,110,121,93,100,92,142,94,4,0,0,0,218,174,125,33,75,120,154,244,0,16,94,95,35,238,152,87,4,0,0,0,172,158,117,33,91,106,213,244,161,4,74,97,222,123,207,80,4,0,0,0,150,156,109,33,135,17,16,245,16,95,61,99,155,185,48,74,4,0,0,0,110,168,101,33,140,110,74,245,49,50,56,101,189,102,187,67,4,0,0,0,7,194,93,33,38,130,132,245,0,145,58,103,148,77,110,61,4,0,0,0,57,233,85,33,12,77,190,245,145,142,68,105,238,66,72,55,4,0,0,0,219,29,78,33,244,207,247,245,16,62,86,107,176,37,72,49,4,0,0,0,196,95,70,33,143,11,49,246,193,178,111,109,117,222,108,43,4,0,0,0,205,174,62,33,142,0,106,246,0,0,145,111,46,95,181,37,4,0,0,0,206,10,55,33,158,175,162,246,65,57,186,113,197,162,32,32,4,0,0,0,160,115,47,33,106,25,219,246,16,114,235,115,203,172,173,26,4,0,0,0,32,233,39,33,155,62,19,247,17,190,36,118,31,137,91,21,4,0,0,0,38,107,32,33,214,31,75,247,0,49,102,120,162,75,41,16,4,0,0,0,143,249,24,33,191,189,130,247,177,222,175,122,233,15,22,11,4,0,0,0,54,148,17,33,249,24,186,247,16,219,1,125,246,248,32,6,4,0,0,0,248,58,10,33,33,50,241,247,33,58,92,127,239,48,73,1,4,0,0,0,179,237,2,33,213,9,40,248,0,16,191,129,182,209,27,249,4,0,0,0,68,172,251,32,176,160,94,248,225,112,42,132,199,176,220,239,4,0,0,0,138,118,244,32,75,247,148,248,16,113,158,134,42,123,211,230,4,0,0,0,98,76,237,32,59,14,203,248,241,36,27,137,74,185,254,221,4,0,0,0,174,45,230,32,21,230,0,249,0,161,160,139,110,255,92,213,4,0,0,0,75,26,223,32,109,127,54,249,209,249,46,142,80,237,236,204,4,0,0,0,28,18,216,32,210,218,107,249,16,68,198,144,178,45,173,196,4,0,0,0,0,21,209,32,211,248,160,249,129,148,102,147,249,117,156,188,4,0,0,0,217,34,202,32,253,217,213,249,0,0,16,150,207,133,185,180,4,0,0,0,136,59,195,32,218,126,10,250,129,155,194,152,194,38,3,173,4,0,0,0,241,94,188,32,243,231,62,250,16,124,126,155,239,43,120,165,4,0,0,0,245,140,181,32,208,21,115,250,209,182,67,158,169,113,23,158,4,0,0,0,121,197,174,32,245,8,167,250,0,97,18,161,42,221,223,150,4,0,0,0,94,8,168,32,231,193,218,250,241,143,234,163,65,92,208,143,4,0,0,0,139,85,161,32,38,65,14,251,16,89,204,166,9,229,231,136,4,0,0,0,226,172,154,32,52,135,65,251,225,209,183,169,157,117,37,130,4,0,0,0,73,14,148,32,143,148,116,251,0,16,173,172,211,19,136,123,4,0,0,0,165,121,141,32,179,105,167,251,33,41,172,175,249,204,14,117,4,0,0,0,219,238,134,32,28,7,218,251,16,51,181,178,149,181,184,110,4,0,0,0,210,109,128,32,68,109,12,252,177,67,200,181,35,233,132,104,4,0,0,0,113,246,121,32,162,156,62,252,0,113,229,184,219,137,114,98,4,0,0,0,157,136,115,32,174,149,112,252,17,209,12,188,123,192,128,92,4,0,0,0,62,36,109,32,220,88,162,252,16,122,62,191,7,188,174,86,4,0,0,0,60,201,102,32,160,230,211,252,65,130,122,194,155,177,251,80,4,0,0,0,126,119,96,32,109,63,5,253,0,0,193,197,51,220,102,75,4,0,0,0,237,46,90,32,178,99,54,253,193,9,18,201,124,124,239,69,4,0,0,0,113,239,83,32,224,83,103,253,16,182,109,204,163,216,148,64,4,0,0,0,243,184,77,32,100,16,152,253,145,27,212,207,36,60,86,59,4,0,0,0,92,139,71,32,171,153,200,253,0,81,69,211,165,247,50,54,4,0,0,0,150,102,65,32,32,240,248,253,49,109,193,214,195,96,42,49,4,0,0,0,139,74,59,32,46,20,41,254,16,135,72,218,240,209,59,44,4,0,0,0,37,55,53,32,60,6,89,254,161,181,218,221,69,170,102,39,4,0,0,0,78,44,47,32,179,198,136,254,0,16,120,225,95,77,170,34,4,0,0,0,240,41,41,32,248,85,184,254,97,173,32,229,60,35,6,30,4,0,0,0,248,47,35,32,113,180,231,254,16,165,212,232,18,152,121,25,4,0,0,0,80,62,29,32,129,226,22,255,113,14,148,236,51,28,4,21,4,0,0,0,229,84,23,32,139,224,69,255,0,1,95,240,229,35,165,16,4,0,0,0,161,115,17,32,240,174,116,255,81,148,53,244,73,39,92,12,4,0,0,0,113,154,11,32,17,78,163,255,16,224,23,248,55,162,40,8,4,0,0,0,66,201,5,32,76,190,209,255,1,252,5,252,35,20,10,4,4,0,0,0,255,255,255,31,255,255,255,255,8,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,1,2,3,4,5,6,7,8,9,255,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,1,2,3,4,5,6,7,8,9,255,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,1,171,205,183,57,163,197,239,241,27,61,167,41,19,53,223,225,139,173,151,25,131,165,207,209,251,29,135,9,243,21,191,193,107,141,119,249,99,133,175,177,219,253,103,233,211,245,159,161,75,109,87,217,67,101,143,145,187,221,71,201,179,213,127,129,43,77,55,185,35,69,111,113,155,189,39,169,147,181,95,97,11,45,23,153,3,37,79,81,123,157,7,137,115,149,63,65,235,13,247,121,227,5,47,49,91,125,231,105,83,117,31,33,203,237,215,89,195,229,15,17,59,93,199,73,51,85,255,2,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var _llvm_expect_i32=undefined;
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  Module["_strlen"] = _strlen;
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var VFS=undefined;
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path, ext) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var f = PATH.splitPath(path)[2];
        if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }
        return f;
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.filter(function(p, index) {
          if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
          }
          return p;
        }).join('/'));
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek
          };
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap
          };
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          };
          node.stream_ops = {};
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = FS.chrdev_stream_ops;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            assert(buffer.length);
            if (canOwn && buffer.buffer === HEAP8.buffer && offset === 0) {
              node.contents = buffer; // this is a subarray of the heap, and we can own it
              node.contentMode = MEMFS.CONTENT_OWNING;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        var done = function(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function() { done(null); };
            req.onerror = function() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function() { done(null); };
            req.onerror = function() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        var isRealDir = function(p) {
          return p !== '.' && p !== '..';
        };
        var toAbsolute = function(root) {
          return function(p) {
            return PATH.join(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, stream.flags);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode)) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        },handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + new Error().stack;
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            return path ? PATH.join(node.mount.mountpoint, path) : node.mount.mountpoint;
          }
          path = path ? PATH.join(node.name, path) : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        var node = {
          id: FS.nextInode++,
          name: name,
          mode: mode,
          node_ops: {},
          stream_ops: {},
          rdev: rdev,
          parent: null,
          mount: null
        };
        if (!parent) {
          parent = node;  // root node sets parent to itself
        }
        node.parent = parent;
        node.mount = parent.mount;
        // compatibility
        var readMode = 292 | 73;
        var writeMode = 146;
        // NOTE we must use Object.defineProperties instead of individual calls to
        // Object.defineProperty in order to make closure compiler happy
        Object.defineProperties(node, {
          read: {
            get: function() { return (node.mode & readMode) === readMode; },
            set: function(val) { val ? node.mode |= readMode : node.mode &= ~readMode; }
          },
          write: {
            get: function() { return (node.mode & writeMode) === writeMode; },
            set: function(val) { val ? node.mode |= writeMode : node.mode &= ~writeMode; }
          },
          isFolder: {
            get: function() { return FS.isDir(node.mode); },
          },
          isDevice: {
            get: function() { return FS.isChrdev(node.mode); },
          },
        });
        FS.hashAddNode(node);
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        // compatibility
        Object.defineProperties(stream, {
          object: {
            get: function() { return stream.node; },
            set: function(val) { stream.node = val; }
          },
          isRead: {
            get: function() { return (stream.flags & 2097155) !== 1; }
          },
          isWrite: {
            get: function() { return (stream.flags & 2097155) !== 0; }
          },
          isAppend: {
            get: function() { return (stream.flags & 1024); }
          }
        });
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        var done = function(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        path = PATH.normalize(path);
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        try {
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072)
          });
          node = lookup.node;
        } catch (e) {
          // ignore
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },staticInit:function () {
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(path, mode | 146);
          var stream = FS.open(path, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(path, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {} : ['binary'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          var handleMessage = function(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stderr|0;var n=+env.NaN;var o=+env.Infinity;var p=0;var q=0;var r=0;var s=0;var t=0,u=0,v=0,w=0,x=0.0,y=0,z=0,A=0,B=0.0;var C=0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=global.Math.floor;var N=global.Math.abs;var O=global.Math.sqrt;var P=global.Math.pow;var Q=global.Math.cos;var R=global.Math.sin;var S=global.Math.tan;var T=global.Math.acos;var U=global.Math.asin;var V=global.Math.atan;var W=global.Math.atan2;var X=global.Math.exp;var Y=global.Math.log;var Z=global.Math.ceil;var _=global.Math.imul;var $=env.abort;var aa=env.assert;var ab=env.asmPrintInt;var ac=env.asmPrintFloat;var ad=env.min;var ae=env.invoke_ii;var af=env.invoke_vi;var ag=env.invoke_vii;var ah=env.invoke_iiii;var ai=env.invoke_v;var aj=env.invoke_iii;var ak=env._pwrite;var al=env._sysconf;var am=env._sbrk;var an=env.___setErrNo;var ao=env._fwrite;var ap=env.__reallyNegative;var aq=env.__formatString;var ar=env._send;var as=env._write;var at=env._abort;var au=env._fprintf;var av=env._time;var aw=env.___errno_location;var ax=env._fflush;var ay=env._isspace;
// EMSCRIPTEN_START_FUNCS
function aF(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function aG(){return i|0}function aH(a){a=a|0;i=a}function aI(a,b){a=a|0;b=b|0;if((p|0)==0){p=a;q=b}}function aJ(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function aK(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function aL(a){a=a|0;C=a}function aM(a){a=a|0;D=a}function aN(a){a=a|0;E=a}function aO(a){a=a|0;F=a}function aP(a){a=a|0;G=a}function aQ(a){a=a|0;H=a}function aR(a){a=a|0;I=a}function aS(a){a=a|0;J=a}function aT(a){a=a|0;K=a}function aU(a){a=a|0;L=a}function aV(){}function aW(){da(6952|0,0|0,100|0);return}function aX(){var a=0,b=0,d=0,e=0;a=0;while(1){if((a|0)>=100){b=-1;d=8;break}e=6952+(a<<2)|0;if((c[e>>2]|0)==0){break}else{a=a+1|0}}if((d|0)==8){return b|0}if((a|0)<=-1){b=a;return b|0}d=c5(12)|0;c[e>>2]=d;a2(d);b=a;return b|0}function aY(a){a=a|0;var b=0;if((a|0)>=100){return}b=6952+(a<<2)|0;a3(c[b>>2]|0);c6(c[b>>2]|0);c[b>>2]=0;return}function aZ(a,b,d){a=a|0;b=b|0;d=d|0;a4(c[6952+(a<<2)>>2]|0,b,d)|0;return}function a_(a,b){a=a|0;b=b|0;return a1(0,a,c[6952+(b<<2)>>2]|0)|0}function a$(a,b,d){a=a|0;b=b|0;d=d|0;a0(c[6952+(a<<2)>>2]|0,c[6952+(b<<2)>>2]|0,c[6952+(d<<2)>>2]|0);return}function a0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=a;a=b;b=d;d=c[a+4>>2]|0;f=c[b+4>>2]|0;if((d|0)>=0){g=d}else{g=-d|0}h=g;if((f|0)>=0){i=f}else{i=-f|0}g=i;if((h|0)<(g|0)){i=a;a=b;b=i;i=d;d=f;f=i;i=h;h=g;g=i}i=h+1|0;if((((i|0)>(c[e>>2]|0)|0)!=0|0)!=0){j=cr(e,i)|0}else{j=c[e+8>>2]|0}k=j;j=c[a+8>>2]|0;a=c[b+8>>2]|0;if((d^f|0)>=0){f=a5(k,j,h,a,g)|0;c[k+(h<<2)>>2]=f;i=h+f|0;if((d|0)<0){i=-i|0}l=i;m=e;n=m+4|0;c[n>>2]=l;return}if((h|0)!=(g|0)){f=k;b=j;o=h;p=a;q=g;a6(f,b,o,p,q)|0;i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=42;break}i=i-1|0}if((d|0)<0){i=-i|0}}else{if((be(j,a,h)|0)<0){q=k;p=a;o=j;b=h;bX(q,p,o,b)|0;i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=53;break}i=i-1|0}if((d|0)>=0){i=-i|0}}else{bX(k,j,a,h)|0;i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=63;break}i=i-1|0}if((d|0)<0){i=-i|0}}}l=i;m=e;n=m+4|0;c[n>>2]=l;return}function a1(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=g|0;j=b;b=e;e=f;f=c[e+4>>2]|0;k=0;if((b|0)>=0){l=1016;if((b|0)<=1){b=10}else{do{if((b|0)>36){l=952;if((b|0)<=62){break}m=0;n=m;i=g;return n|0}}while(0)}}else{b=-b|0;do{if((b|0)<=1){b=10}else{if((b|0)<=36){break}m=0;n=m;i=g;return n|0}}while(0);l=432}if((j|0)==0){if((f|0)>=0){o=f}else{o=-f|0}if((o|0)==0){k=1}else{if((f|0)>=0){p=f}else{p=-f|0}o=c[(c[e+8>>2]|0)+(p-1<<2)>>2]|0;if(o>>>0<65536){q=o>>>0<256?1:9}else{q=o>>>0<16777216?17:25}p=q;if((f|0)>=0){r=f}else{r=-f|0}q=(r<<5)-(33-p-(d[1056+(o>>>(p>>>0))|0]|0))|0;if((b&b-1|0)==0){p=c[1204+(b*20|0)>>2]|0;k=((q+p-1|0)>>>0)/(p>>>0)|0}else{p=(c[1196+(b*20|0)>>2]|0)+1|0;o=q;q=p&65535;r=p>>>16;p=o&65535;s=o>>>16;o=_(q,p)|0;t=_(q,s)|0;q=_(r,p)|0;p=_(r,s)|0;t=t+(o>>>16)|0;t=t+q|0;if(t>>>0<q>>>0){p=p+65536|0}k=p+(t>>>16)+1|0}}k=k+(((f|0)<0)+1)|0;j=az[c[1736]&3](k)|0}t=j;if((f|0)<0){p=j;j=p+1|0;a[p]=45;f=-f|0}c[h>>2]=0;p=c[e+8>>2]|0;if((b&b-1|0)!=0){if((((f|1)<<2>>>0<65536|0)!=0|0)!=0){q=i;i=i+((f|1)<<2)|0;i=i+7&-8;u=q}else{u=cs(h,(f|1)<<2)|0}p=u;if((f|0)!=0){u=f-1|0;q=p;o=c[e+8>>2]|0;e=o;o=e+4|0;s=c[e>>2]|0;if((u|0)!=0){do{e=q;q=e+4|0;c[e>>2]=s;e=o;o=e+4|0;s=c[e>>2]|0;e=u-1|0;u=e;}while((e|0)!=0)}u=q;q=u+4|0;c[u>>2]=s}}s=a7(j,b,p,f)|0;f=0;while(1){if(f>>>0>=s>>>0){break}a[j+f|0]=a[l+(a[j+f|0]|0)|0]|0;f=f+1|0}a[j+s|0]=0;if((((c[h>>2]|0)!=0|0)!=0|0)!=0){ct(c[h>>2]|0)}if((k|0)!=0){h=s+1+(j-t)|0;if((k|0)!=(h|0)){t=aC[c[1584]&3](t,k,h)|0}}m=t;n=m;i=g;return n|0}function a2(a){a=a|0;var b=0;b=a;c[b>>2]=1;c[b+8>>2]=az[c[1736]&3](4)|0;c[b+4>>2]=0;return}function a3(a){a=a|0;var b=0;b=a;aB[c[1586]&3](c[b+8>>2]|0,c[b>>2]<<2);return}function a4(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+8|0;h=g|0;j=b;b=e;e=f;f=6352;do{if((e|0)>36){f=f+208|0;if((e|0)<=62){break}k=-1;l=k;i=g;return l|0}}while(0);do{m=b;b=m+1|0;n=d[m]|0;}while((ay(n|0)|0)!=0);m=0;if((n|0)==45){m=1;o=b;b=o+1|0;n=d[o]|0}if((e|0)==0){p=10}else{p=e}if((d[f+n|0]|0|0)>=(p|0)){k=-1;l=k;i=g;return l|0}if((e|0)==0){e=10;if((n|0)==48){e=8;p=b;b=p+1|0;n=d[p]|0;do{if((n|0)==120){q=195}else{if((n|0)==88){q=195;break}if((n|0)==98){q=198}else{if((n|0)==66){q=198}}if((q|0)==198){e=2;p=b;b=p+1|0;n=d[p]|0}}}while(0);if((q|0)==195){e=16;p=b;b=p+1|0;n=d[p]|0}}}while(1){if((n|0)==48){r=1}else{r=(ay(n|0)|0)!=0}if(!r){break}p=b;b=p+1|0;n=d[p]|0}if((n|0)==0){c[j+4>>2]=0;k=0;l=k;i=g;return l|0}c[h>>2]=0;r=db(b-1|0)|0;if((((r+1|0)>>>0<65536|0)!=0|0)!=0){p=i;i=i+(r+1)|0;i=i+7&-8;s=p}else{s=cs(h,r+1|0)|0}p=s;o=s;s=0;while(1){if(s>>>0>=r>>>0){break}if((ay(n|0)|0)==0){t=d[f+n|0]|0;if((t|0)>=(e|0)){q=216;break}u=o;o=u+1|0;a[u]=t&255}t=b;b=t+1|0;n=d[t]|0;s=s+1|0}if((q|0)==216){if((((c[h>>2]|0)!=0|0)!=0|0)!=0){ct(c[h>>2]|0)}k=-1;l=k;i=g;return l|0}r=o-p|0;o=c[1200+(e*20|0)>>2]|0;q=r;s=o&65535;n=o>>>16;o=q&65535;b=q>>>16;q=_(s,o)|0;f=_(s,b)|0;s=_(n,o)|0;o=_(n,b)|0;f=f+(q>>>16)|0;f=f+s|0;if(f>>>0<s>>>0){o=o+65536|0}s=((o+(f>>>16)<<3>>>0)/32|0)+2|0;if((((s|0)>(c[j>>2]|0)|0)!=0|0)!=0){v=cr(j,s)|0}else{v=c[j+8>>2]|0}s=ba(c[j+8>>2]|0,p,r,e)|0;if((m|0)!=0){w=-s|0}else{w=s}c[j+4>>2]=w;if((((c[h>>2]|0)!=0|0)!=0|0)!=0){ct(c[h>>2]|0)}k=0;l=k;i=g;return l|0}function a5(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=a;a=b;b=d;d=f;L312:do{if((d|0)!=0){do{if((bo(g,a,e,d)|0)!=0){while(1){if((d|0)>=(b|0)){h=252;break}f=(c[a+(d<<2)>>2]|0)+1|0;i=d;d=i+1|0;c[g+(i<<2)>>2]=f;if((f|0)!=0){h=255;break}}if((h|0)==252){j=1;break L312}else if((h|0)==255){break}}}while(0);h=257}else{h=257}}while(0);if((h|0)==257){if((g|0)!=(a|0)){h=d;while(1){if((h|0)>=(b|0)){break}c[g+(h<<2)>>2]=c[a+(h<<2)>>2];h=h+1|0}}j=0}return j|0}function a6(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=a;a=b;b=d;d=f;L340:do{if((d|0)!=0){do{if((bX(g,a,e,d)|0)!=0){while(1){if((d|0)>=(b|0)){h=273;break}f=c[a+(d<<2)>>2]|0;i=d;d=i+1|0;c[g+(i<<2)>>2]=f-1;if((f|0)!=0){h=276;break}}if((h|0)==273){j=1;break L340}else if((h|0)==276){break}}}while(0);h=278}else{h=278}}while(0);if((h|0)==278){if((g|0)!=(a|0)){h=d;while(1){if((h|0)>=(b|0)){break}c[g+(h<<2)>>2]=c[a+(h<<2)>>2];h=h+1|0}}j=0}return j|0}function a7(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;h=i;i=i+784|0;j=h|0;k=h+8|0;l=h+648|0;m=h+656|0;n=b;b=e;e=f;f=g;if((f|0)==0){a[n|0]=0;o=1;p=o;i=h;return p|0}if((b&b-1|0)==0){g=c[1204+(b*20|0)>>2]|0;q=n;r=c[e+(f-1<<2)>>2]|0;s=r;if(s>>>0<65536){t=s>>>0<256?1:9}else{t=s>>>0<16777216?17:25}u=t;t=33-u-(d[1056+(s>>>(u>>>0))|0]|0)|0;u=(f<<5)-t|0;t=(u>>>0)%(g>>>0)|0;if((t|0)!=0){u=u+(g-t)|0}t=u-(f-1<<5)|0;u=f-1|0;while(1){t=t-g|0;while(1){if((t|0)<0){break}s=q;q=s+1|0;a[s]=r>>>(t>>>0)&(1<<g)-1&255;t=t-g|0}u=u-1|0;if((u|0)<0){break}s=r<<-t&(1<<g)-1;r=c[e+(u<<2)>>2]|0;t=t+32|0;v=q;q=v+1|0;a[v]=(s|r>>>(t>>>0))&255}o=q-n|0;p=o;i=h;return p|0}if((f|0)<35){o=(a8(n,0,e,f,b)|0)-n|0;p=o;i=h;return p|0}c[l>>2]=0;q=cs(l,f+64<<2)|0;t=q;c[j>>2]=c[1204+(b*20|0)>>2];r=c[1192+(b*20|0)>>2]|0;u=c[1196+(b*20|0)>>2]|0;g=f<<5;s=u&65535;v=u>>>16;u=g&65535;w=g>>>16;g=_(s,u)|0;x=_(s,w)|0;s=_(v,u)|0;u=_(v,w)|0;x=x+(g>>>16)|0;x=x+s|0;if(x>>>0<s>>>0){u=u+65536|0}s=0;g=(((u+(x>>>16)|0)>>>0)/((c[1192+(b*20|0)>>2]|0)>>>0)|0)+1|0;while(1){if((g|0)==1){break}c[m+(s<<2)>>2]=g;s=s+1|0;g=g+1>>1}c[m+(s<<2)>>2]=1;c[k>>2]=j;c[k+4>>2]=1;c[k+12>>2]=r;c[k+16>>2]=b;c[k+8>>2]=0;c[k+20>>2]=t;t=t+8|0;c[c[k+20>>2]>>2]=c[j>>2];c[k+24>>2]=1;c[k+32>>2]=r;c[k+36>>2]=b;c[k+28>>2]=0;g=1;x=j;u=1;w=0;v=2;while(1){if((v|0)>=(s|0)){break}y=t;t=t+((g<<1)+2<<2)|0;if((((t>>>0<(q+(f+64<<2)|0)>>>0^1)&1|0)!=0|0)!=0){z=323;break}bP(y,x,g);r=r<<1;g=g<<1;g=g-((c[y+(g-1<<2)>>2]|0)==0)|0;u=u<<1;if((u+1|0)<(c[m+(s-v<<2)>>2]|0)){r=r+(c[1192+(b*20|0)>>2]|0)|0;A=bC(y,y,g,c[j>>2]|0)|0;c[y+(g<<2)>>2]=A;g=g+((A|0)!=0)|0;u=u+1|0}w=w<<1;while(1){if((c[y>>2]|0)!=0){break}y=y+4|0;g=g-1|0;w=w+1|0}x=y;c[k+(v*20|0)>>2]=x;c[k+(v*20|0)+4>>2]=g;c[k+(v*20|0)+12>>2]=r;c[k+(v*20|0)+16>>2]=b;c[k+(v*20|0)+8>>2]=w;v=v+1|0}if((z|0)==323){bh(664,489,904);return 0}v=1;while(1){if((v|0)>=(s|0)){break}y=c[k+(v*20|0)>>2]|0;g=c[k+(v*20|0)+4>>2]|0;A=bC(y,y,g,c[j>>2]|0)|0;c[y+(g<<2)>>2]=A;g=g+((A|0)!=0)|0;if((c[y>>2]|0)==0){c[k+(v*20|0)>>2]=y+4;g=g-1|0;z=k+(v*20|0)+8|0;c[z>>2]=(c[z>>2]|0)+1}c[k+(v*20|0)+4>>2]=g;z=k+(v*20|0)+12|0;c[z>>2]=(c[z>>2]|0)+(c[1192+(b*20|0)>>2]|0);v=v+1|0}b=(a9(n,0,e,f,k+((v-1|0)*20|0)|0,cs(l,f+32<<2)|0)|0)-n|0;if((((c[l>>2]|0)!=0|0)!=0|0)!=0){ct(c[l>>2]|0)}o=b;p=o;i=h;return p|0}function a8(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+856|0;k=j|0;l=j+712|0;m=b;b=e;e=f;f=g;g=h;if((g|0)==10){if((f|0)!=0){h=f-1|0;n=l+4|0;o=e;p=o;o=p+4|0;q=c[p>>2]|0;if((h|0)!=0){do{p=n;n=p+4|0;c[p>>2]=q;p=o;o=p+4|0;q=c[p>>2]|0;p=h-1|0;h=p;}while((p|0)!=0)}h=n;n=h+4|0;c[h>>2]=q}r=k+712|0;while(1){if((f|0)<=1){break}bM(l|0,1,l+4|0,f,1e9,316718722,2)|0;f=f-((c[l+(f<<2)>>2]|0)==0)|0;q=(c[l>>2]|0)+1<<0;r=r-9|0;h=q;n=10;o=h&65535;p=h>>>16;h=n&65535;s=n>>>16;n=_(o,h)|0;t=_(o,s)|0;o=_(p,h)|0;h=_(p,s)|0;t=t+(n>>>16)|0;t=t+o|0;if(t>>>0<o>>>0){h=h+65536|0}o=h+(t>>>16)|0;q=(t<<16)+(n&65535)|0;n=r;r=n+1|0;a[n]=o&255;n=q;t=10;h=n&65535;s=n>>>16;n=t&65535;p=t>>>16;t=_(h,n)|0;u=_(h,p)|0;h=_(s,n)|0;n=_(s,p)|0;u=u+(t>>>16)|0;u=u+h|0;if(u>>>0<h>>>0){n=n+65536|0}o=n+(u>>>16)|0;q=(u<<16)+(t&65535)|0;t=r;r=t+1|0;a[t]=o&255;t=7;q=(q+15|0)>>>4;do{q=q*10|0;o=q>>>28;u=r;r=u+1|0;a[u]=o&255;q=q&268435455;u=t-1|0;t=u;}while((u|0)!=0);r=r-9|0}v=c[l+4>>2]|0;while(1){if((v|0)==0){break}t=(v>>>0)/10|0;q=v-(t*10|0)|0;v=t;w=q;q=r-1|0;r=q;a[q]=w&255}}else{q=c[1192+(g*20|0)>>2]|0;t=c[1204+(g*20|0)>>2]|0;o=c[1208+(g*20|0)>>2]|0;u=t;if(u>>>0<65536){x=u>>>0<256?1:9}else{x=u>>>0<16777216?17:25}n=x;x=33-n-(d[1056+(u>>>(n>>>0))|0]|0)|0;if((f|0)!=0){n=f-1|0;u=l+4|0;h=e;e=h;h=e+4|0;p=c[e>>2]|0;if((n|0)!=0){do{e=u;u=e+4|0;c[e>>2]=p;e=h;h=e+4|0;p=c[e>>2]|0;e=n-1|0;n=e;}while((e|0)!=0)}n=u;u=n+4|0;c[n>>2]=p}r=k+712|0;while(1){if((f|0)<=1){break}bM(l|0,1,l+4|0,f,t,o,x)|0;f=f-((c[l+(f<<2)>>2]|0)==0)|0;p=(c[l>>2]|0)+1<<0;r=r+(-q|0)|0;n=q;do{u=p;h=g;e=u&65535;s=u>>>16;u=h&65535;y=h>>>16;h=_(e,u)|0;z=_(e,y)|0;e=_(s,u)|0;u=_(s,y)|0;z=z+(h>>>16)|0;z=z+e|0;if(z>>>0<e>>>0){u=u+65536|0}p=(z<<16)+(h&65535)|0;h=r;r=h+1|0;a[h]=u+(z>>>16)&255;z=n-1|0;n=z;}while((z|0)!=0);r=r+(-q|0)|0}v=c[l+4>>2]|0;while(1){if((v|0)==0){break}l=(v>>>0)/(g>>>0)|0;q=v-(_(l,g)|0)|0;v=l;w=q;q=r-1|0;r=q;a[q]=w&255}}w=k+712-r|0;while(1){if(w>>>0>=b>>>0){break}k=m;m=k+1|0;a[k]=0;b=b-1|0}while(1){if((w|0)==0){break}b=r;r=b+1|0;k=m;m=k+1|0;a[k]=a[b]|0;w=w-1|0}i=j;return m|0}function a9(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;i=b;b=d;d=e;e=f;f=g;g=h;if((e|0)<18){if((e|0)!=0){i=a8(i,b,d,e,c[f+16>>2]|0)|0}else{while(1){if((b|0)==0){break}h=i;i=h+1|0;a[h]=0;b=b-1|0}}j=i;return j|0}h=c[f>>2]|0;k=c[f+4>>2]|0;l=c[f+8>>2]|0;do{if((e|0)<(k+l|0)){m=442}else{if((e|0)==(k+l|0)){if((be(d+(l<<2)|0,h,e-l|0)|0)<0){m=442;break}}n=g;o=d;bf(n,o+(l<<2)|0,0,d+(l<<2)|0,e-l|0,h,k);p=e-l-k|0;p=p+((c[n+(p<<2)>>2]|0)!=0)|0;if((b|0)!=0){b=b-(c[f+12>>2]|0)|0}i=a9(i,b,n,p,f-20|0,g+(p<<2)|0)|0;i=a9(i,c[f+12>>2]|0,o,k+l|0,f-20|0,g)|0}}while(0);if((m|0)==442){i=a9(i,b,d,e,f-20|0,g)|0}j=i;return j|0}function ba(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+648|0;h=g|0;j=g+640|0;k=a;a=b;b=e;e=f;if((e&e-1|0)!=0){if(b>>>0<2e3){l=bb(k,a,b,e)|0;m=l;i=g;return m|0}c[j>>2]=0;f=((b>>>0)/((c[1192+(e*20|0)>>2]|0)>>>0)|0)+1|0;bc(h|0,cs(j,f+32<<2)|0,f,e);n=bd(k,a,b,h|0,cs(j,f+32<<2)|0)|0;if((((c[j>>2]|0)!=0|0)!=0|0)!=0){ct(c[j>>2]|0)}l=n;m=l;i=g;return m|0}n=c[1204+(e*20|0)>>2]|0;e=0;j=0;f=0;h=a+b-1|0;while(1){if(h>>>0<a>>>0){break}b=d[h]|0;j=j|b<<f;f=f+n|0;if((f|0)>=32){o=e;e=o+1|0;c[k+(o<<2)>>2]=j;f=f-32|0;j=b>>n-f}h=h-1|0}if((j|0)!=0){h=e;e=h+1|0;c[k+(h<<2)>>2]=j}l=e;m=l;i=g;return m|0}function bb(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=a;a=b;b=e;e=f;f=c[1204+(e*20|0)>>2]|0;h=c[1192+(e*20|0)>>2]|0;i=0;j=h;while(1){if(j>>>0>=b>>>0){break}k=a;a=k+1|0;l=d[k]|0;if((e|0)==10){m=8;while(1){if((m|0)==0){break}k=a;a=k+1|0;l=(l*10|0)+(d[k]|0)|0;m=m-1|0}}else{m=h-1|0;while(1){if((m|0)==0){break}k=_(l,e)|0;n=a;a=n+1|0;l=k+(d[n]|0)|0;m=m-1|0}}if((i|0)==0){if((l|0)!=0){c[g>>2]=l;i=1}}else{o=bC(g,g,i,f)|0;o=o+(bn(g,g,i,l)|0)|0;if((o|0)!=0){n=i;i=n+1|0;c[g+(n<<2)>>2]=o}}j=j+h|0}f=e;n=a;a=n+1|0;l=d[n]|0;if((e|0)==10){m=b-(j-9)-1|0;while(1){if((m|0)<=0){break}n=a;a=n+1|0;l=(l*10|0)+(d[n]|0)|0;f=f*10|0;m=m-1|0}}else{m=b-(j-h)-1|0;while(1){if((m|0)<=0){break}h=_(l,e)|0;j=a;a=j+1|0;l=h+(d[j]|0)|0;f=_(f,e)|0;m=m-1|0}}if((i|0)==0){if((l|0)!=0){c[g>>2]=l;i=1}p=i;return p|0}else{o=bC(g,g,i,f)|0;o=o+(bn(g,g,i,l)|0)|0;if((o|0)!=0){l=i;i=l+1|0;c[g+(l<<2)>>2]=o}p=i;return p|0}return 0}function bc(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=a;a=b;b=e;e=f;f=a;h=c[1192+(e*20|0)>>2]|0;i=c[1204+(e*20|0)>>2]|0;j=f;f=f+4|0;k=h;c[j>>2]=i;l=1;m=b-1|0;if(m>>>0<65536){n=m>>>0<256?1:9}else{n=m>>>0<16777216?17:25}o=n;n=33-o-(d[1056+(m>>>(o>>>0))|0]|0)|0;n=31-n|0;c[g+(n*20|0)>>2]=j;c[g+(n*20|0)+4>>2]=l;c[g+(n*20|0)+12>>2]=k;c[g+(n*20|0)+16>>2]=e;c[g+(n*20|0)+8>>2]=0;o=0;m=n-1|0;while(1){if((m|0)<0){p=542;break}n=f;f=f+(l<<1<<2)|0;if((((f>>>0<(a+(b+32<<2)|0)>>>0^1)&1|0)!=0|0)!=0){p=531;break}bP(n,j,l);l=(l<<1)-1|0;l=l+((c[n+(l<<2)>>2]|0)!=0)|0;k=k<<1;if((b-1>>m&2|0)==0){br(n,n,l,i);l=l-((c[n+(l-1<<2)>>2]|0)==0)|0;k=k-h|0}o=o<<1;while(1){if((c[n>>2]|0)==0){q=(c[n+4>>2]&(i&-i)-1|0)==0}else{q=0}if(!q){break}n=n+4|0;l=l-1|0;o=o+1|0}j=n;c[g+(m*20|0)>>2]=j;c[g+(m*20|0)+4>>2]=l;c[g+(m*20|0)+12>>2]=k;c[g+(m*20|0)+16>>2]=e;c[g+(m*20|0)+8>>2]=o;m=m-1|0}if((p|0)==542){return}else if((p|0)==531){bh(472,178,800)}}function bd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=a;a=b;b=d;d=e;e=f;f=c[d+12>>2]|0;if(b>>>0<=f>>>0){if(b>>>0>=750){h=bd(g,a,b,d+20|0,e)|0;i=h;return i|0}else{h=bb(g,a,b,c[d+16>>2]|0)|0;i=h;return i|0}}j=b-f|0;if(j>>>0>=750){k=bd(e,a,j,d+20|0,g)|0}else{k=bb(e,a,j,c[d+16>>2]|0)|0}j=c[d+8>>2]|0;if((k|0)==0){if(((c[d+4>>2]|0)+j+1|0)!=0){l=g;m=(c[d+4>>2]|0)+j+1|0;do{n=l;l=n+4|0;c[n>>2]=0;n=m-1|0;m=n;}while((n|0)!=0)}}else{if((c[d+4>>2]|0)>(k|0)){m=g+(j<<2)|0;l=c[d>>2]|0;n=c[d+4>>2]|0;o=e;p=k;cu(m,l,n,o,p)|0}else{p=g+(j<<2)|0;o=e;n=k;l=c[d>>2]|0;m=c[d+4>>2]|0;cu(p,o,n,l,m)|0}if((j|0)!=0){m=g;l=j;do{n=m;m=n+4|0;c[n>>2]=0;n=l-1|0;l=n;}while((n|0)!=0)}}a=a+b+(-f|0)|0;if(f>>>0>=750){q=bd(e,a,f,d+20|0,e+(c[d+4>>2]<<2)+(j<<2)+4|0)|0}else{q=bb(e,a,f,c[d+16>>2]|0)|0}if((q|0)!=0){f=bo(g,g,e,q)|0;e=g+(q<<2)|0;q=(c[e>>2]|0)+f|0;c[e>>2]=q;if(q>>>0<f>>>0){do{f=e+4|0;e=f;q=(c[f>>2]|0)+1|0;c[f>>2]=q;}while((q|0)==0)}}e=k+(c[d+4>>2]|0)+j|0;h=e-((c[g+(e-1<<2)>>2]|0)==0)|0;i=h;return i|0}function be(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=0;f=d;while(1){d=f-1|0;f=d;if((d|0)<0){break}g=c[e+(f<<2)>>2]|0;h=c[a+(f<<2)>>2]|0;if((g|0)!=(h|0)){i=597;break}}if((i|0)==597){b=g>>>0>h>>>0?1:-1}return b|0}function bf(a,b,e,f,g,h,j){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;k=i;i=i+32|0;l=k|0;m=k+8|0;n=k+16|0;o=k+24|0;p=a;a=b;b=f;f=g;g=h;h=j;if(((((e|0)==0^1)&1|0)!=0|0)!=0){bh(320,51,784)}e=h;if((e|0)==0){bj()}else if((e|0)==1){c[a>>2]=bs(p,0,b,f,c[g>>2]|0)|0;i=k;return}else if((e|0)==2){c[l>>2]=0;if((c[g+4>>2]&-2147483648|0)==0){e=c[g+4>>2]|0;if(e>>>0<65536){q=e>>>0<256?1:9}else{q=e>>>0<16777216?17:25}j=q;q=33-j-(d[1056+(e>>>(j>>>0))|0]|0)|0;q=q|0;r=m|0;c[r+4>>2]=c[g+4>>2]<<q|(c[g>>2]|0)>>>((32-q|0)>>>0);c[r>>2]=c[g>>2]<<q;if(((f+1<<2>>>0<65536|0)!=0|0)!=0){m=i;i=i+(f+1<<2)|0;i=i+7&-8;s=m}else{s=cs(l,f+1<<2)|0}t=s;s=bu(t,b,f,q)|0;c[t+(f<<2)>>2]=s;u=bt(p,0,t,f+((s|0)!=0)|0,r)|0;if((s|0)==0){c[p+(f-2<<2)>>2]=u}c[a>>2]=(c[t>>2]|0)>>>(q>>>0)|c[t+4>>2]<<32-q;c[a+4>>2]=(c[t+4>>2]|0)>>>(q>>>0)}else{r=g;if(((f<<2>>>0<65536|0)!=0|0)!=0){q=i;i=i+(f<<2)|0;i=i+7&-8;v=q}else{v=cs(l,f<<2)|0}t=v;if((f|0)!=0){v=f-1|0;q=t;s=b;m=s;s=m+4|0;j=c[m>>2]|0;if((v|0)!=0){do{m=q;q=m+4|0;c[m>>2]=j;m=s;s=m+4|0;j=c[m>>2]|0;m=v-1|0;v=m;}while((m|0)!=0)}v=q;q=v+4|0;c[v>>2]=j}u=bt(p,0,t,f,r)|0;c[p+(f-2<<2)>>2]=u;c[a>>2]=c[t>>2];c[a+4>>2]=c[t+4>>2]}if((((c[l>>2]|0)!=0|0)!=0|0)!=0){ct(c[l>>2]|0)}i=k;return}else{c[o>>2]=0;l=(c[b+(f-1<<2)>>2]|0)>>>0>=(c[g+(h-1<<2)>>2]|0)>>>0|0;if((f+l|0)>=(h<<1|0)){c[p+(f-h<<2)>>2]=0;if((c[g+(h-1<<2)>>2]&-2147483648|0)==0){t=c[g+(h-1<<2)>>2]|0;if(t>>>0<65536){w=t>>>0<256?1:9}else{w=t>>>0<16777216?17:25}u=w;x=33-u-(d[1056+(t>>>(u>>>0))|0]|0)|0;x=x|0;if(((h<<2>>>0<65536|0)!=0|0)!=0){u=i;i=i+(h<<2)|0;i=i+7&-8;y=u}else{y=cs(o,h<<2)|0}z=y;y=z;u=g;t=h;w=x;bu(y,u,t,w)|0;if(((f+1<<2>>>0<65536|0)!=0|0)!=0){w=i;i=i+(f+1<<2)|0;i=i+7&-8;A=w}else{A=cs(o,f+1<<2)|0}B=A;c[B+(f<<2)>>2]=bu(B,b,f,x)|0;f=f+l|0}else{x=0;z=g;if(((f+1<<2>>>0<65536|0)!=0|0)!=0){A=i;i=i+(f+1<<2)|0;i=i+7&-8;C=A}else{C=cs(o,f+1<<2)|0}B=C;if((f|0)!=0){C=f-1|0;A=B;w=b;t=w;w=t+4|0;u=c[t>>2]|0;if((C|0)!=0){do{t=A;A=t+4|0;c[t>>2]=u;t=w;w=t+4|0;u=c[t>>2]|0;t=C-1|0;C=t;}while((t|0)!=0)}C=A;A=C+4|0;c[C>>2]=u}c[B+(f<<2)>>2]=0;f=f+l|0}u=(c[z+(h-1<<2)>>2]|0)>>>16;C=c[z+(h-1<<2)>>2]&65535;A=(~c[z+(h-1<<2)>>2]>>>0)/(u>>>0)|0;w=~c[z+(h-1<<2)>>2];t=w-(_(A,u)|0)|0;w=_(A,C)|0;t=t<<16|65535;if(t>>>0<w>>>0){A=A-1|0;t=t+(c[z+(h-1<<2)>>2]|0)|0;if(t>>>0>=(c[z+(h-1<<2)>>2]|0)>>>0){if(t>>>0<w>>>0){A=A-1|0;t=t+(c[z+(h-1<<2)>>2]|0)|0}}}t=t-w|0;y=(t>>>0)/(u>>>0)|0;r=t-(_(y,u)|0)|0;w=_(y,C)|0;r=r<<16|65535;if(r>>>0<w>>>0){y=y-1|0;r=r+(c[z+(h-1<<2)>>2]|0)|0;if(r>>>0>=(c[z+(h-1<<2)>>2]|0)>>>0){if(r>>>0<w>>>0){y=y-1|0;r=r+(c[z+(h-1<<2)>>2]|0)|0}}}r=r-w|0;w=A<<16|y;y=_(c[z+(h-1<<2)>>2]|0,w)|0;y=y+(c[z+(h-2<<2)>>2]|0)|0;if(y>>>0<(c[z+(h-2<<2)>>2]|0)>>>0){w=w-1|0;A=-(y>>>0>=(c[z+(h-1<<2)>>2]|0)>>>0|0)|0;y=y-(c[z+(h-1<<2)>>2]|0)|0;w=w+A|0;y=y-(A&c[z+(h-1<<2)>>2])|0}A=c[z+(h-2<<2)>>2]|0;r=w;C=A&65535;u=A>>>16;A=r&65535;t=r>>>16;r=_(C,A)|0;j=_(C,t)|0;C=_(u,A)|0;A=_(u,t)|0;j=j+(r>>>16)|0;j=j+C|0;if(j>>>0<C>>>0){A=A+65536|0}C=A+(j>>>16)|0;A=(j<<16)+(r&65535)|0;y=y+C|0;if(y>>>0<C>>>0){w=w-1|0;if(((y>>>0>=(c[z+(h-1<<2)>>2]|0)>>>0|0)!=0|0)!=0){if(y>>>0>(c[z+(h-1<<2)>>2]|0)>>>0){D=724}else{if(A>>>0>=(c[z+(h-2<<2)>>2]|0)>>>0){D=724}}if((D|0)==724){w=w-1|0}}}c[n>>2]=w;if((h|0)>=50){do{if((h|0)>=200){if((f|0)<4e3){D=733;break}if(+(h|0)*3600.0+ +(f|0)*200.0>+(h|0)*+(f|0)){D=733;break}w=bA(f,h,0)|0;if(((w<<2>>>0<65536|0)!=0|0)!=0){A=i;i=i+(w<<2)|0;i=i+7&-8;E=A}else{E=cs(o,w<<2)|0}w=p;A=a;y=B;C=f;r=z;j=h;t=E;bv(w,A,y,C,r,j,t)|0;B=a}else{D=733}}while(0);if((D|0)==733){E=p;t=B;j=f;r=z;C=h;bq(E,t,j,r,C,n)|0}}else{C=p;r=B;j=f;t=z;z=h;E=c[n>>2]|0;bO(C,r,j,t,z,E)|0}if((x|0)!=0){E=a;z=B;t=h;j=x;bN(E,z,t,j)|0}else{if((h|0)!=0){j=h-1|0;t=a;z=B;B=z;z=B+4|0;E=c[B>>2]|0;if((j|0)!=0){do{B=t;t=B+4|0;c[B>>2]=E;B=z;z=B+4|0;E=c[B>>2]|0;B=j-1|0;j=B;}while((B|0)!=0)}j=t;t=j+4|0;c[j>>2]=E}}if((((c[o>>2]|0)!=0|0)!=0|0)!=0){ct(c[o>>2]|0)}i=k;return}E=f-h|0;c[p+(E<<2)>>2]=0;E=E+l|0;if((E|0)==0){if((h|0)!=0){j=h-1|0;t=a;z=b;B=z;z=B+4|0;x=c[B>>2]|0;if((j|0)!=0){do{B=t;t=B+4|0;c[B>>2]=x;B=z;z=B+4|0;x=c[B>>2]|0;B=j-1|0;j=B;}while((B|0)!=0)}j=t;t=j+4|0;c[j>>2]=x}if((((c[o>>2]|0)!=0|0)!=0|0)!=0){ct(c[o>>2]|0)}i=k;return}x=h-E|0;if((c[g+(h-1<<2)>>2]&-2147483648|0)==0){j=c[g+(h-1<<2)>>2]|0;if(j>>>0<65536){F=j>>>0<256?1:9}else{F=j>>>0<16777216?17:25}t=F;G=33-t-(d[1056+(j>>>(t>>>0))|0]|0)|0;G=G|0;if(((E<<2>>>0<65536|0)!=0|0)!=0){t=i;i=i+(E<<2)|0;i=i+7&-8;H=t}else{H=cs(o,E<<2)|0}I=H;H=I;t=g+(x<<2)|0;j=E;F=G;bu(H,t,j,F)|0;F=I|0;c[F>>2]=c[F>>2]|(c[g+(x-1<<2)>>2]|0)>>>((32-G|0)>>>0);if((((E<<1)+1<<2>>>0<65536|0)!=0|0)!=0){F=i;i=i+((E<<1)+1<<2)|0;i=i+7&-8;J=F}else{J=cs(o,(E<<1)+1<<2)|0}K=J;L=bu(K,b+(f<<2)+(-(E<<1)<<2)|0,E<<1,G)|0;if((l|0)!=0){c[K+(E<<1<<2)>>2]=L;K=K+4|0}else{J=K|0;c[J>>2]=c[J>>2]|(c[b+(f-(E<<1)-1<<2)>>2]|0)>>>((32-G|0)>>>0)}}else{G=0;I=g+(x<<2)|0;if((((E<<1)+1<<2>>>0<65536|0)!=0|0)!=0){J=i;i=i+((E<<1)+1<<2)|0;i=i+7&-8;M=J}else{M=cs(o,(E<<1)+1<<2)|0}K=M;if((E<<1|0)!=0){M=(E<<1)-1|0;J=K;F=b+(f<<2)+(-(E<<1)<<2)|0;j=F;F=j+4|0;t=c[j>>2]|0;if((M|0)!=0){do{j=J;J=j+4|0;c[j>>2]=t;j=F;F=j+4|0;t=c[j>>2]|0;j=M-1|0;M=j;}while((j|0)!=0)}M=J;J=M+4|0;c[M>>2]=t}if((l|0)!=0){c[K+(E<<1<<2)>>2]=0;K=K+4|0}}if((E|0)==1){l=c[I>>2]<<0>>>16;t=c[I>>2]<<0&65535;M=((c[K+4>>2]|0)>>>0)/(l>>>0)|0;J=c[K+4>>2]|0;F=J-(_(M,l)|0)|0;J=_(M,t)|0;F=F<<16|c[K>>2]<<0>>>16;if(F>>>0<J>>>0){M=M-1|0;F=F+(c[I>>2]<<0)|0;if(F>>>0>=c[I>>2]<<0>>>0){if(F>>>0<J>>>0){M=M-1|0;F=F+(c[I>>2]<<0)|0}}}F=F-J|0;j=(F>>>0)/(l>>>0)|0;H=F-(_(j,l)|0)|0;J=_(j,t)|0;H=H<<16|c[K>>2]<<0&65535;if(H>>>0<J>>>0){j=j-1|0;H=H+(c[I>>2]<<0)|0;if(H>>>0>=c[I>>2]<<0>>>0){if(H>>>0<J>>>0){j=j-1|0;H=H+(c[I>>2]<<0)|0}}}H=H-J|0;c[K>>2]=H>>>0;c[p>>2]=M<<16|j}else{if((E|0)==2){j=p;M=K;H=I;bt(j,0,M,4,H)|0}else{H=(c[I+(E-1<<2)>>2]|0)>>>16;M=c[I+(E-1<<2)>>2]&65535;j=(~c[I+(E-1<<2)>>2]>>>0)/(H>>>0)|0;J=~c[I+(E-1<<2)>>2];t=J-(_(j,H)|0)|0;J=_(j,M)|0;t=t<<16|65535;if(t>>>0<J>>>0){j=j-1|0;t=t+(c[I+(E-1<<2)>>2]|0)|0;if(t>>>0>=(c[I+(E-1<<2)>>2]|0)>>>0){if(t>>>0<J>>>0){j=j-1|0;t=t+(c[I+(E-1<<2)>>2]|0)|0}}}t=t-J|0;l=(t>>>0)/(H>>>0)|0;F=t-(_(l,H)|0)|0;J=_(l,M)|0;F=F<<16|65535;if(F>>>0<J>>>0){l=l-1|0;F=F+(c[I+(E-1<<2)>>2]|0)|0;if(F>>>0>=(c[I+(E-1<<2)>>2]|0)>>>0){if(F>>>0<J>>>0){l=l-1|0;F=F+(c[I+(E-1<<2)>>2]|0)|0}}}F=F-J|0;J=j<<16|l;l=_(c[I+(E-1<<2)>>2]|0,J)|0;l=l+(c[I+(E-2<<2)>>2]|0)|0;if(l>>>0<(c[I+(E-2<<2)>>2]|0)>>>0){J=J-1|0;j=-(l>>>0>=(c[I+(E-1<<2)>>2]|0)>>>0|0)|0;l=l-(c[I+(E-1<<2)>>2]|0)|0;J=J+j|0;l=l-(j&c[I+(E-1<<2)>>2])|0}j=c[I+(E-2<<2)>>2]|0;F=J;M=j&65535;H=j>>>16;j=F&65535;t=F>>>16;F=_(M,j)|0;z=_(M,t)|0;M=_(H,j)|0;j=_(H,t)|0;z=z+(F>>>16)|0;z=z+M|0;if(z>>>0<M>>>0){j=j+65536|0}M=j+(z>>>16)|0;j=(z<<16)+(F&65535)|0;l=l+M|0;if(l>>>0<M>>>0){J=J-1|0;if(((l>>>0>=(c[I+(E-1<<2)>>2]|0)>>>0|0)!=0|0)!=0){if(l>>>0>(c[I+(E-1<<2)>>2]|0)>>>0){D=881}else{if(j>>>0>=(c[I+(E-2<<2)>>2]|0)>>>0){D=881}}if((D|0)==881){J=J-1|0}}}c[n>>2]=J;if((E|0)>=50){if((E|0)>=2e3){J=bA(E<<1,E,0)|0;if(((J<<2>>>0<65536|0)!=0|0)!=0){j=i;i=i+(J<<2)|0;i=i+7&-8;N=j}else{N=cs(o,J<<2)|0}J=a;if((b|0)==(J|0)){J=J+(f-E<<2)|0}f=p;j=J;l=K;M=E<<1;F=I;z=E;t=N;bv(f,j,l,M,F,z,t)|0;if((E|0)!=0){t=E-1|0;z=K;F=J;J=F;F=J+4|0;M=c[J>>2]|0;if((t|0)!=0){do{J=z;z=J+4|0;c[J>>2]=M;J=F;F=J+4|0;M=c[J>>2]|0;J=t-1|0;t=J;}while((J|0)!=0)}t=z;z=t+4|0;c[t>>2]=M}}else{M=p;t=K;z=E<<1;F=I;J=E;bq(M,t,z,F,J,n)|0}}else{J=p;F=K;z=E<<1;t=I;M=E;l=c[n>>2]|0;bO(J,F,z,t,M,l)|0}}}l=E;if((x-2|0)<0){O=0}else{O=c[g+(x-2<<2)>>2]|0}M=c[g+(x-1<<2)>>2]<<G|O>>>1>>>(((~G>>>0)%32|0)>>>0);O=c[p+(E-1<<2)>>2]<<0;t=M&65535;z=M>>>16;M=O&65535;F=O>>>16;O=_(t,M)|0;J=_(t,F)|0;t=_(z,M)|0;M=_(z,F)|0;J=J+(O>>>16)|0;J=J+t|0;if(J>>>0<t>>>0){M=M+65536|0}if((c[K+(E-1<<2)>>2]|0)>>>0<(M+(J>>>16)|0)>>>0){J=p;do{M=J;J=M+4|0;t=c[M>>2]|0;c[M>>2]=t-1;}while((t|0)==0);J=bo(K,K,I,E)|0;if((J|0)!=0){c[K+(E<<2)>>2]=J;l=l+1|0}}J=0;if((G|0)!=0){I=bu(K,K,l,32-G|0)|0;t=K|0;c[t>>2]=c[t>>2]|c[b+(x-1<<2)>>2]&-1>>>(G>>>0);t=bY(K,p,E,c[g+(x-1<<2)>>2]&-1>>>(G>>>0))|0;if((E|0)!=(l|0)){if(((((c[K+(E<<2)>>2]|0)>>>0>=t>>>0^1)&1|0)!=0|0)!=0){bh(320,343,400)}G=K+(E<<2)|0;c[G>>2]=(c[G>>2]|0)-t}else{c[K+(E<<2)>>2]=I-t;J=I>>>0<t>>>0|0;l=l+1|0}x=x-1|0}if(((h<<2>>>0<65536|0)!=0|0)!=0){t=i;i=i+(h<<2)|0;i=i+7&-8;P=t}else{P=cs(o,h<<2)|0}t=P;do{if((x|0)<(E|0)){if((x|0)!=0){P=t;I=p;G=E;M=g;O=x;cu(P,I,G,M,O)|0;D=969;break}if((l|0)!=0){O=l-1|0;M=a;G=K;I=G;G=I+4|0;P=c[I>>2]|0;if((O|0)!=0){do{I=M;M=I+4|0;c[I>>2]=P;I=G;G=I+4|0;P=c[I>>2]|0;I=O-1|0;O=I;}while((I|0)!=0)}O=M;M=O+4|0;c[O>>2]=P}if(((((l|0)==(h|0)^1)&1|0)!=0|0)!=0){bh(320,364,288)}}else{O=t;G=g;I=x;F=p;z=E;cu(O,G,I,F,z)|0;D=969}}while(0);if((D|0)==969){L=a6(K,K,l,t+(x<<2)|0,E)|0;if((h-x|0)!=0){E=h-x-1|0;D=a+(x<<2)|0;z=K;K=z;z=K+4|0;F=c[K>>2]|0;if((E|0)!=0){do{K=D;D=K+4|0;c[K>>2]=F;K=z;z=K+4|0;F=c[K>>2]|0;K=E-1|0;E=K;}while((K|0)!=0)}E=D;D=E+4|0;c[E>>2]=F}J=J|L;L=bX(a,b,t,x)|0;L=bW(a+(x<<2)|0,a+(x<<2)|0,l,L)|0;J=J|L}if((J|0)!=0){J=p;do{p=J;J=p+4|0;L=c[p>>2]|0;c[p>>2]=L-1;}while((L|0)==0);bo(a,a,g,h)|0}if((((c[o>>2]|0)!=0|0)!=0|0)!=0){ct(c[o>>2]|0)}i=k;return}}function bg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=b;b=d;if((f|0)==0){i=e;return}if((a[f|0]|0)==0){i=e;return}au(c[m>>2]|0,280,(d=i,i=i+8|0,c[d>>2]=f,d)|0)|0;i=d;if((b|0)!=-1){f=c[m>>2]|0;g=b;au(f|0,776,(d=i,i=i+8|0,c[d>>2]=g,d)|0)|0;i=d}i=e;return}function bh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;bg(a,b);au(c[m>>2]|0,368,(b=i,i=i+8|0,c[b>>2]=d,b)|0)|0;i=b;at();i=e;return}function bi(a){a=a|0;c[1964]=c[1964]|a;c[1962]=10/(c[1966]|0)|0;at();return}function bj(){bi(2);return}function bk(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;a=c5(d)|0;if((a|0)==0){e=c[m>>2]|0;f=d;au(e|0,192,(e=i,i=i+8|0,c[e>>2]=f,e)|0)|0;i=e;at();return 0}else{i=b;return a|0}return 0}function bl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=d;d=c7(a,f)|0;if((d|0)==0){a=c[m>>2]|0;g=b;b=f;au(a|0,712,(a=i,i=i+16|0,c[a>>2]=g,c[a+8>>2]=b,a)|0)|0;i=a;at();return 0}else{i=e;return d|0}return 0}function bm(a,b){a=a|0;b=b|0;c6(a);return}function bn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=c[a>>2]|0;g=e+d|0;c[f>>2]=g;if(g>>>0<d>>>0){h=1;d=1;while(1){if((d|0)>=(b|0)){break}e=c[a+(d<<2)>>2]|0;g=e+1|0;c[f+(d<<2)>>2]=g;d=d+1|0;if(g>>>0>=1){i=1029;break}}if((i|0)==1029){if((a|0)!=(f|0)){i=d;while(1){if((i|0)>=(b|0)){break}c[f+(i<<2)>>2]=c[a+(i<<2)>>2];i=i+1|0}}h=0}}else{if((a|0)!=(f|0)){i=1;while(1){if((i|0)>=(b|0)){break}c[f+(i<<2)>>2]=c[a+(i<<2)>>2];i=i+1|0}}h=0}return h|0}function bo(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=0;do{g=a;a=g+4|0;h=c[g>>2]|0;g=b;b=g+4|0;i=h+(c[g>>2]|0)|0;g=i+e|0;e=i>>>0<h>>>0|g>>>0<i>>>0;i=f;f=i+4|0;c[i>>2]=g;g=d-1|0;d=g;}while((g|0)!=0);return e|0}function bp(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=a;a=b;b=d;d=e;e=f;f=g;g=d>>1;i=d-g|0;if((i|0)>=50){j=bp(h+(g<<2)|0,a+(g<<1<<2)|0,b+(g<<2)|0,i,e,f)|0}else{j=bO(h+(g<<2)|0,a+(g<<1<<2)|0,i<<1,b+(g<<2)|0,i,c[e>>2]|0)|0}cu(f,h+(g<<2)|0,i,b,g)|0;k=bX(a+(g<<2)|0,a+(g<<2)|0,f,d)|0;if((j|0)!=0){k=k+(bX(a+(d<<2)|0,a+(d<<2)|0,b,g)|0)|0}while(1){if((k|0)==0){break}j=j-(bW(h+(g<<2)|0,h+(g<<2)|0,i,1)|0)|0;k=k-(bo(a+(g<<2)|0,a+(g<<2)|0,b,d)|0)|0}if((g|0)>=50){l=bp(h,a+(i<<2)|0,b+(i<<2)|0,g,e,f)|0}else{l=bO(h,a+(i<<2)|0,g<<1,b+(i<<2)|0,g,c[e>>2]|0)|0}cu(f,b,i,h,g)|0;k=bX(a,a,f,d)|0;if((l|0)!=0){k=k+(bX(a+(g<<2)|0,a+(g<<2)|0,b,i)|0)|0}while(1){if((k|0)==0){break}bW(h,h,g,1)|0;k=k-(bo(a,a,b,d)|0)|0}return j|0}function bq(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;h=i;j=a;a=b;b=d;d=e;e=f;f=g;g=0;k=i;i=i+(e<<2)|0;i=i+7&-8;l=k;k=b-e|0;j=j+(k<<2)|0;a=a+(b<<2)|0;d=d+(e<<2)|0;if((k|0)>(e|0)){do{k=k-e|0;}while((k|0)>(e|0));j=j+(-k<<2)|0;a=a+(-k<<2)|0;if((k|0)==1){m=(be(a+(-e<<2)+4|0,d+(-e<<2)|0,e)|0)>=0|0;if((m|0)!=0){n=a+(-e<<2)+4|0;o=a+(-e<<2)+4|0;p=d+(-e<<2)|0;q=e;bX(n,o,p,q)|0}q=c[a>>2]|0;p=c[a-4>>2]|0;o=c[a-8>>2]|0;n=c[d-4>>2]|0;r=c[d-8>>2]|0;do{if((((q|0)==(n|0)|0)!=0|0)!=0){if((p|0)!=(r|0)){s=1098;break}t=-1;u=bY(a+(-e<<2)|0,d+(-e<<2)|0,e,t)|0}else{s=1098}}while(0);if((s|0)==1098){v=q;w=c[f>>2]|0;x=v&65535;y=v>>>16;v=w&65535;z=w>>>16;w=_(x,v)|0;A=_(x,z)|0;x=_(y,v)|0;v=_(y,z)|0;A=A+(w>>>16)|0;A=A+x|0;if(A>>>0<x>>>0){v=v+65536|0}t=v+(A>>>16)|0;v=(A<<16)+(w&65535)|0;w=v+p|0;t=t+q+(w>>>0<v>>>0)|0;v=w;p=p-(_(n,t)|0)|0;p=p-n-(o>>>0<r>>>0)|0;o=o-r|0;w=r;q=t;A=w&65535;x=w>>>16;w=q&65535;z=q>>>16;q=_(A,w)|0;y=_(A,z)|0;A=_(x,w)|0;w=_(x,z)|0;y=y+(q>>>16)|0;y=y+A|0;if(y>>>0<A>>>0){w=w+65536|0}A=(y<<16)+(q&65535)|0;p=p-(w+(y>>>16))-(o>>>0<A>>>0)|0;o=o-A|0;t=t+1|0;A=-(p>>>0>=v>>>0|0)|0;t=t+A|0;v=o+(A&r)|0;p=p+(A&n)+(v>>>0<o>>>0)|0;o=v;if(((p>>>0>=n>>>0|0)!=0|0)!=0){if(p>>>0>n>>>0){s=1118}else{if(o>>>0>=r>>>0){s=1118}}if((s|0)==1118){t=t+1|0;p=p-n-(o>>>0<r>>>0)|0;o=o-r|0}}if((e|0)>2){r=bY(a+(-e<<2)|0,d+(-e<<2)|0,e-2|0,t)|0;s=o>>>0<r>>>0|0;o=o-r|0;r=p>>>0<s>>>0|0;p=p-s|0;c[a-8>>2]=o;if((((r|0)!=0|0)!=0|0)!=0){p=p+(n+(bo(a+(-e<<2)|0,a+(-e<<2)|0,d+(-e<<2)|0,e-1|0)|0))|0;m=m-((t|0)==0)|0;t=t-1|0}}else{c[a-8>>2]=o}c[a-4>>2]=p}c[j>>2]=t}else{if((k|0)==2){m=bt(j,0,a-8|0,4,d-8|0)|0}else{if((k|0)>=50){m=bp(j,a+(-k<<2)|0,d+(-k<<2)|0,k,f,l)|0}else{m=bO(j,a+(-k<<2)|0,k<<1,d+(-k<<2)|0,k,c[f>>2]|0)|0}}if((k|0)!=(e|0)){if((k|0)>(e-k|0)){t=l;p=j;o=k;n=d+(-e<<2)|0;r=e-k|0;cu(t,p,o,n,r)|0}else{r=l;n=d+(-e<<2)|0;o=e-k|0;p=j;t=k;cu(r,n,o,p,t)|0}u=bX(a+(-e<<2)|0,a+(-e<<2)|0,l,e)|0;if((m|0)!=0){u=u+(bX(a+(-e<<2)+(k<<2)|0,a+(-e<<2)+(k<<2)|0,d+(-e<<2)|0,e-k|0)|0)|0}while(1){if((u|0)==0){break}m=m-(bW(j,j,k,1)|0)|0;u=u-(bo(a+(-e<<2)|0,a+(-e<<2)|0,d+(-e<<2)|0,e)|0)|0}}}k=b-e-k|0;do{j=j+(-e<<2)|0;a=a+(-e<<2)|0;bp(j,a+(-e<<2)|0,d+(-e<<2)|0,e,f,l)|0;k=k-e|0;}while((k|0)>0)}else{j=j+(-k<<2)|0;a=a+(-k<<2)|0;if((k|0)>=50){m=bp(j,a+(-k<<2)|0,d+(-k<<2)|0,k,f,l)|0}else{m=bO(j,a+(-k<<2)|0,k<<1,d+(-k<<2)|0,k,c[f>>2]|0)|0}if((k|0)!=(e|0)){if((k|0)>(e-k|0)){f=l;b=j;t=k;p=d+(-e<<2)|0;o=e-k|0;cu(f,b,t,p,o)|0}else{o=l;p=d+(-e<<2)|0;t=e-k|0;b=j;f=k;cu(o,p,t,b,f)|0}u=bX(a+(-e<<2)|0,a+(-e<<2)|0,l,e)|0;if((m|0)!=0){u=u+(bX(a+(-e<<2)+(k<<2)|0,a+(-e<<2)+(k<<2)|0,d+(-e<<2)|0,e-k|0)|0)|0}while(1){if((u|0)==0){break}m=m-(bW(j,j,k,1)|0)|0;u=u-(bo(a+(-e<<2)|0,a+(-e<<2)|0,d+(-e<<2)|0,e)|0)|0}}}if((((g|0)!=0|0)!=0|0)!=0){ct(g)}i=h;return m|0}function br(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=b;b=e;e=f;if((e&1|0)==0){f=e;if((((f&255|0)!=0|0)!=0|0)!=0){h=(d[1056+(f&-f)|0]|0)-2|0}else{i=6;while(1){if((i|0)>=30){break}f=f>>>8;if((((f&255|0)!=0|0)!=0|0)!=0){j=1187;break}i=i+8|0}h=i+(d[1056+(f&-f)|0]|0)|0}e=e>>>(h>>>0)}else{h=0}f=e;i=d[6816+(((f>>>0)/2|0)&127)|0]|0;i=(i<<1)-(_(_(i,i)|0,f)|0)|0;i=(i<<1)-(_(_(i,i)|0,f)|0)|0;f=i;e=e<<0;if((h|0)==0){k=c[a>>2]|0;l=_(k,f)|0;c[g>>2]=l;m=0;n=1;while(1){if((n|0)>=(b|0)){break}i=l;j=e;o=i&65535;p=i>>>16;i=j&65535;q=j>>>16;j=_(o,i)|0;r=_(o,q)|0;o=_(p,i)|0;i=_(p,q)|0;r=r+(j>>>16)|0;r=r+o|0;if(r>>>0<o>>>0){i=i+65536|0}s=i+(r>>>16)|0;t=(r<<16)+(j&65535)|0;m=m+s|0;k=c[a+(n<<2)>>2]|0;j=k;r=j-m|0;l=r;m=r>>>0>j>>>0|0;l=_(l,f)|0;c[g+(n<<2)>>2]=l;n=n+1|0}return}m=0;k=c[a>>2]|0;n=1;while(1){if((n|0)>=(b|0)){break}j=c[a+(n<<2)>>2]|0;u=k>>>(h>>>0)|j<<32-h;k=j;j=u;r=j-m|0;l=r;m=r>>>0>j>>>0|0;l=_(l,f)|0;c[g+(n-1<<2)>>2]=l;j=l;r=e;i=j&65535;o=j>>>16;j=r&65535;q=r>>>16;r=_(i,j)|0;p=_(i,q)|0;i=_(o,j)|0;j=_(o,q)|0;p=p+(r>>>16)|0;p=p+i|0;if(p>>>0<i>>>0){j=j+65536|0}s=j+(p>>>16)|0;t=(p<<16)+(r&65535)|0;m=m+s|0;n=n+1|0}do{}while((n|0)<(b|0));u=k>>>(h>>>0);l=u-m|0;l=_(l,f)|0;c[g+(b-1<<2)>>2]=l;return}function bs(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;h=a;a=b;b=e;e=f;f=g;g=0;i=e+a|0;if((i|0)==0){j=0;k=j;return k|0}f=f<<0;h=h+(i-1<<2)|0;if((f&-2147483648|0)==0){if((e|0)!=0){l=c[b+(e-1<<2)>>2]<<0;do{if(l>>>0<f>>>0){g=l>>>0;m=h;h=m-4|0;c[m>>2]=0;i=i-1|0;if((i|0)!=0){e=e-1|0;break}j=g;k=j;return k|0}}while(0)}m=f;if(m>>>0<65536){n=m>>>0<256?1:9}else{n=m>>>0<16777216?17:25}o=n;n=33-o-(d[1056+(m>>>(o>>>0))|0]|0)|0;f=f<<n;g=g<<n;o=f>>>16;m=f&65535;p=(~f>>>0)/(o>>>0)|0;q=~f-(_(p,o)|0)|0;r=_(p,m)|0;q=q<<16|65535;if(q>>>0<r>>>0){p=p-1|0;q=q+f|0;if(q>>>0>=f>>>0){if(q>>>0<r>>>0){p=p-1|0;q=q+f|0}}}q=q-r|0;s=(q>>>0)/(o>>>0)|0;t=q-(_(s,o)|0)|0;r=_(s,m)|0;t=t<<16|65535;if(t>>>0<r>>>0){s=s-1|0;t=t+f|0;if(t>>>0>=f>>>0){if(t>>>0<r>>>0){s=s-1|0;t=t+f|0}}}t=t-r|0;r=p<<16|s;if((e|0)!=0){l=c[b+(e-1<<2)>>2]<<0;g=g|l>>>((32-n|0)>>>0);u=e-2|0;while(1){if((u|0)<0){break}v=c[b+(u<<2)>>2]<<0;s=l<<n|v>>>((32-n|0)>>>0);p=g;t=r;m=p&65535;o=p>>>16;p=t&65535;q=t>>>16;t=_(m,p)|0;w=_(m,q)|0;m=_(o,p)|0;p=_(o,q)|0;w=w+(t>>>16)|0;w=w+m|0;if(w>>>0<m>>>0){p=p+65536|0}m=p+(w>>>16)|0;p=(w<<16)+(t&65535)|0;t=p+s|0;m=m+(g+1)+(t>>>0<p>>>0)|0;p=t;t=s-(_(m,f)|0)|0;s=-(t>>>0>p>>>0|0)|0;m=m+s|0;t=t+(s&f)|0;if(((t>>>0>=f>>>0|0)!=0|0)!=0){t=t-f|0;m=m+1|0}g=t;c[h>>2]=m;g=g>>>0;h=h-4|0;l=v;u=u-1|0}m=g;t=r;s=m&65535;p=m>>>16;m=t&65535;w=t>>>16;t=_(s,m)|0;q=_(s,w)|0;s=_(p,m)|0;m=_(p,w)|0;q=q+(t>>>16)|0;q=q+s|0;if(q>>>0<s>>>0){m=m+65536|0}s=m+(q>>>16)|0;m=(q<<16)+(t&65535)|0;t=m+(l<<n)|0;s=s+(g+1)+(t>>>0<m>>>0)|0;m=t;t=(l<<n)-(_(s,f)|0)|0;l=-(t>>>0>m>>>0|0)|0;s=s+l|0;t=t+(l&f)|0;if(((t>>>0>=f>>>0|0)!=0|0)!=0){t=t-f|0;s=s+1|0}g=t;c[h>>2]=s;g=g>>>0;h=h-4|0}u=a-1|0;while(1){if((u|0)<0){break}s=g;t=r;l=s&65535;m=s>>>16;s=t&65535;q=t>>>16;t=_(l,s)|0;w=_(l,q)|0;l=_(m,s)|0;s=_(m,q)|0;w=w+(t>>>16)|0;w=w+l|0;if(w>>>0<l>>>0){s=s+65536|0}l=s+(w>>>16)|0;l=l+(g+1)|0;s=_(-l|0,f)|0;q=-(s>>>0>((w<<16)+(t&65535)|0)>>>0|0)|0;l=l+q|0;s=s+(q&f)|0;g=s;c[h>>2]=l;g=g>>>0;h=h-4|0;u=u-1|0}j=g>>>(n>>>0);k=j;return k|0}if((e|0)!=0){g=c[b+(e-1<<2)>>2]<<0;n=g>>>0>=f>>>0|0;r=h;h=r-4|0;c[r>>2]=n;g=g-(f&-n)|0;g=g>>>0;i=i-1|0;e=e-1|0}do{if(!1){if((i|0)>=0){break}u=e-1|0;while(1){if((u|0)<0){break}v=c[b+(u<<2)>>2]<<0;n=f>>>16;r=f&65535;l=(g>>>0)/(n>>>0)|0;s=g-(_(l,n)|0)|0;q=_(l,r)|0;s=s<<16|v>>>16;if(s>>>0<q>>>0){l=l-1|0;s=s+f|0;if(s>>>0>=f>>>0){if(s>>>0<q>>>0){l=l-1|0;s=s+f|0}}}s=s-q|0;t=(s>>>0)/(n>>>0)|0;w=s-(_(t,n)|0)|0;q=_(t,r)|0;w=w<<16|v&65535;if(w>>>0<q>>>0){t=t-1|0;w=w+f|0;if(w>>>0>=f>>>0){if(w>>>0<q>>>0){t=t-1|0;w=w+f|0}}}w=w-q|0;c[h>>2]=l<<16|t;g=w;g=g>>>0;h=h-4|0;u=u-1|0}u=a-1|0;while(1){if((u|0)<0){break}w=f>>>16;t=f&65535;l=(g>>>0)/(w>>>0)|0;q=g-(_(l,w)|0)|0;r=_(l,t)|0;q=q<<16;if(q>>>0<r>>>0){l=l-1|0;q=q+f|0;if(q>>>0>=f>>>0){if(q>>>0<r>>>0){l=l-1|0;q=q+f|0}}}q=q-r|0;n=(q>>>0)/(w>>>0)|0;s=q-(_(n,w)|0)|0;r=_(n,t)|0;s=s<<16;if(s>>>0<r>>>0){n=n-1|0;s=s+f|0;if(s>>>0>=f>>>0){if(s>>>0<r>>>0){n=n-1|0;s=s+f|0}}}s=s-r|0;c[h>>2]=l<<16|n;g=s;g=g>>>0;h=h-4|0;u=u-1|0}j=g;k=j;return k|0}}while(0);i=f>>>16;s=f&65535;n=(~f>>>0)/(i>>>0)|0;l=~f-(_(n,i)|0)|0;r=_(n,s)|0;l=l<<16|65535;if(l>>>0<r>>>0){n=n-1|0;l=l+f|0;if(l>>>0>=f>>>0){if(l>>>0<r>>>0){n=n-1|0;l=l+f|0}}}l=l-r|0;t=(l>>>0)/(i>>>0)|0;w=l-(_(t,i)|0)|0;r=_(t,s)|0;w=w<<16|65535;if(w>>>0<r>>>0){t=t-1|0;w=w+f|0;if(w>>>0>=f>>>0){if(w>>>0<r>>>0){t=t-1|0;w=w+f|0}}}w=w-r|0;r=n<<16|t;u=e-1|0;while(1){if((u|0)<0){break}v=c[b+(u<<2)>>2]<<0;e=g;t=r;n=e&65535;w=e>>>16;e=t&65535;s=t>>>16;t=_(n,e)|0;i=_(n,s)|0;n=_(w,e)|0;e=_(w,s)|0;i=i+(t>>>16)|0;i=i+n|0;if(i>>>0<n>>>0){e=e+65536|0}n=e+(i>>>16)|0;e=(i<<16)+(t&65535)|0;t=e+v|0;n=n+(g+1)+(t>>>0<e>>>0)|0;e=t;t=v-(_(n,f)|0)|0;i=-(t>>>0>e>>>0|0)|0;n=n+i|0;t=t+(i&f)|0;if(((t>>>0>=f>>>0|0)!=0|0)!=0){t=t-f|0;n=n+1|0}g=t;c[h>>2]=n;g=g>>>0;h=h-4|0;u=u-1|0}u=a-1|0;while(1){if((u|0)<0){break}a=g;v=r;b=a&65535;n=a>>>16;a=v&65535;t=v>>>16;v=_(b,a)|0;i=_(b,t)|0;b=_(n,a)|0;a=_(n,t)|0;i=i+(v>>>16)|0;i=i+b|0;if(i>>>0<b>>>0){a=a+65536|0}b=a+(i>>>16)|0;b=b+(g+1)|0;a=_(-b|0,f)|0;t=-(a>>>0>((i<<16)+(v&65535)|0)>>>0|0)|0;b=b+t|0;a=a+(t&f)|0;g=a;c[h>>2]=b;g=g>>>0;h=h-4|0;u=u-1|0}j=g;k=j;return k|0}function bt(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;g=i;i=i+8|0;h=g|0;j=a;a=b;b=d;d=e;e=f;b=b+(d-2<<2)|0;f=c[e+4>>2]|0;k=c[e>>2]|0;e=c[b+4>>2]|0;l=c[b>>2]|0;m=0;do{if(e>>>0>=f>>>0){if(e>>>0<=f>>>0){if(l>>>0<k>>>0){break}}e=e-f-(l>>>0<k>>>0)|0;l=l-k|0;m=1}}while(0);n=f>>>16;o=f&65535;p=(~f>>>0)/(n>>>0)|0;q=~f-(_(p,n)|0)|0;r=_(p,o)|0;q=q<<16|65535;if(q>>>0<r>>>0){p=p-1|0;q=q+f|0;if(q>>>0>=f>>>0){if(q>>>0<r>>>0){p=p-1|0;q=q+f|0}}}q=q-r|0;s=(q>>>0)/(n>>>0)|0;t=q-(_(s,n)|0)|0;r=_(s,o)|0;t=t<<16|65535;if(t>>>0<r>>>0){s=s-1|0;t=t+f|0;if(t>>>0>=f>>>0){if(t>>>0<r>>>0){s=s-1|0;t=t+f|0}}}t=t-r|0;r=p<<16|s;s=_(f,r)|0;s=s+k|0;if(s>>>0<k>>>0){r=r-1|0;p=-(s>>>0>=f>>>0|0)|0;s=s-f|0;r=r+p|0;s=s-(p&f)|0}p=k;t=r;o=p&65535;n=p>>>16;p=t&65535;q=t>>>16;t=_(o,p)|0;u=_(o,q)|0;o=_(n,p)|0;p=_(n,q)|0;u=u+(t>>>16)|0;u=u+o|0;if(u>>>0<o>>>0){p=p+65536|0}o=p+(u>>>16)|0;p=(u<<16)+(t&65535)|0;s=s+o|0;if(s>>>0<o>>>0){r=r-1|0;if(((s>>>0>=f>>>0|0)!=0|0)!=0){if(s>>>0>f>>>0){v=1464}else{if(p>>>0>=k>>>0){v=1464}}if((v|0)==1464){r=r-1|0}}}c[h>>2]=r;j=j+(a<<2)|0;r=d-2-1|0;while(1){if((r|0)<0){break}d=c[b-4>>2]|0;p=e;s=c[h>>2]|0;o=p&65535;t=p>>>16;p=s&65535;u=s>>>16;s=_(o,p)|0;q=_(o,u)|0;o=_(t,p)|0;p=_(t,u)|0;q=q+(s>>>16)|0;q=q+o|0;if(q>>>0<o>>>0){p=p+65536|0}o=p+(q>>>16)|0;p=(q<<16)+(s&65535)|0;s=p+l|0;o=o+e+(s>>>0<p>>>0)|0;p=s;e=l-(_(f,o)|0)|0;e=e-f-(d>>>0<k>>>0)|0;l=d-k|0;d=k;s=o;q=d&65535;u=d>>>16;d=s&65535;t=s>>>16;s=_(q,d)|0;n=_(q,t)|0;q=_(u,d)|0;d=_(u,t)|0;n=n+(s>>>16)|0;n=n+q|0;if(n>>>0<q>>>0){d=d+65536|0}q=(n<<16)+(s&65535)|0;e=e-(d+(n>>>16))-(l>>>0<q>>>0)|0;l=l-q|0;o=o+1|0;q=-(e>>>0>=p>>>0|0)|0;o=o+q|0;p=l+(q&k)|0;e=e+(q&f)+(p>>>0<l>>>0)|0;l=p;if(((e>>>0>=f>>>0|0)!=0|0)!=0){if(e>>>0>f>>>0){v=1490}else{if(l>>>0>=k>>>0){v=1490}}if((v|0)==1490){v=0;o=o+1|0;e=e-f-(l>>>0<k>>>0)|0;l=l-k|0}}b=b-4|0;c[j+(r<<2)>>2]=o;r=r-1|0}if((((a|0)!=0|0)!=0|0)==0){w=e;x=b;y=x+4|0;c[y>>2]=w;z=l;A=b;B=A|0;c[B>>2]=z;C=m;i=g;return C|0}j=j+(-a<<2)|0;r=a-1|0;while(1){if((r|0)<0){break}a=e;o=c[h>>2]|0;p=a&65535;q=a>>>16;a=o&65535;n=o>>>16;o=_(p,a)|0;d=_(p,n)|0;p=_(q,a)|0;a=_(q,n)|0;d=d+(o>>>16)|0;d=d+p|0;if(d>>>0<p>>>0){a=a+65536|0}p=a+(d>>>16)|0;a=(d<<16)+(o&65535)|0;o=a+l|0;p=p+e+(o>>>0<a>>>0)|0;a=o;e=l-(_(f,p)|0)|0;e=e-f-(0<k>>>0)|0;l=-k|0;o=k;d=p;n=o&65535;q=o>>>16;o=d&65535;s=d>>>16;d=_(n,o)|0;t=_(n,s)|0;n=_(q,o)|0;o=_(q,s)|0;t=t+(d>>>16)|0;t=t+n|0;if(t>>>0<n>>>0){o=o+65536|0}n=(t<<16)+(d&65535)|0;e=e-(o+(t>>>16))-(l>>>0<n>>>0)|0;l=l-n|0;p=p+1|0;n=-(e>>>0>=a>>>0|0)|0;p=p+n|0;a=l+(n&k)|0;e=e+(n&f)+(a>>>0<l>>>0)|0;l=a;if(((e>>>0>=f>>>0|0)!=0|0)!=0){if(e>>>0>f>>>0){v=1520}else{if(l>>>0>=k>>>0){v=1520}}if((v|0)==1520){v=0;p=p+1|0;e=e-f-(l>>>0<k>>>0)|0;l=l-k|0}}c[j+(r<<2)>>2]=p;r=r-1|0}w=e;x=b;y=x+4|0;c[y>>2]=w;z=l;A=b;B=A|0;c[B>>2]=z;C=m;i=g;return C|0}function bu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=d;d=e;a=a+(b<<2)|0;f=f+(b<<2)|0;e=32-d|0;g=a-4|0;a=g;h=c[g>>2]|0;g=h>>>(e>>>0);i=h<<d;j=b-1|0;while(1){if((j|0)==0){break}b=a-4|0;a=b;h=c[b>>2]|0;b=f-4|0;f=b;c[b>>2]=i|h>>>(e>>>0);i=h<<d;j=j-1|0}j=f-4|0;f=j;c[j>>2]=i;return g|0}function bv(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=d-f|0;if((h+100|0)>=(f|0)){j=bw(i,a,b,d,e,f,g)|0;k=j;return k|0}j=bw(i,a+(d<<2)+(-((h<<1)+1|0)<<2)|0,b+(d<<2)+(-((h<<1)+1|0)<<2)|0,(h<<1)+1|0,e+(f<<2)+(-(h+1|0)<<2)|0,h+1|0,g)|0;if((f-(h+1)|0)>(h|0)){l=g;m=e;n=f-(h+1)|0;o=i;p=h;cu(l,m,n,o,p)|0}else{p=g;o=i;n=h;m=e;l=f-(h+1)|0;cu(p,o,n,m,l)|0}if((j|0)!=0){q=bo(g+(h<<2)|0,g+(h<<2)|0,e,f-(h+1)|0)|0}else{q=0}c[g+(f-1<<2)>>2]=q;q=bX(a,b,g,d-((h<<1)+1)|0)|0;q=bx(a+(d<<2)+(-((h<<1)+1|0)<<2)|0,a+(d<<2)+(-((h<<1)+1|0)<<2)|0,g+(d<<2)+(-((h<<1)+1|0)<<2)|0,h+1|0,q)|0;if((q|0)!=0){j=j-(bW(i,i,h,1)|0)|0;h=a;i=a;a=e;e=f;bo(h,i,a,e)|0}k=j;return k|0}function bw(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=bz(d-f|0,f,0)|0;j=g;k=g+(h<<2)+4|0;if((f|0)!=(h|0)){if((((bn(k,e+(f<<2)+(-(h+1|0)<<2)|0,h+1|0,1)|0)!=0|0)!=0|0)!=0){if((h|0)!=0){l=j;m=h;do{n=l;l=n+4|0;c[n>>2]=0;n=m-1|0;m=n;}while((n|0)!=0)}}else{m=j;l=k;n=h+1|0;cD(m,l,n,0)|0;if((h|0)!=0){n=h-1|0;l=j;m=j+4|0;o=m;m=o+4|0;p=c[o>>2]|0;if((n|0)!=0){do{o=l;l=o+4|0;c[o>>2]=p;o=m;m=o+4|0;p=c[o>>2]|0;o=n-1|0;n=o;}while((o|0)!=0)}n=l;l=n+4|0;c[n>>2]=p}}q=i;r=a;s=b;t=d;u=e;v=f;w=j;x=h;y=g;z=h;A=y+(z<<2)|0;B=by(q,r,s,t,u,v,w,x,A)|0;C=B;D=C;return D|0}if((h|0)!=0){p=h-1|0;n=k+4|0;l=e;m=l;l=m+4|0;o=c[m>>2]|0;if((p|0)!=0){do{m=n;n=m+4|0;c[m>>2]=o;m=l;l=m+4|0;o=c[m>>2]|0;m=p-1|0;p=m;}while((m|0)!=0)}p=n;n=p+4|0;c[p>>2]=o}c[k>>2]=1;cD(j,k,h+1|0,0)|0;if((h|0)!=0){k=h-1|0;o=j;p=j+4|0;n=p;p=n+4|0;l=c[n>>2]|0;if((k|0)!=0){do{n=o;o=n+4|0;c[n>>2]=l;n=p;p=n+4|0;l=c[n>>2]|0;n=k-1|0;k=n;}while((n|0)!=0)}k=o;o=k+4|0;c[k>>2]=l}q=i;r=a;s=b;t=d;u=e;v=f;w=j;x=h;y=g;z=h;A=y+(z<<2)|0;B=by(q,r,s,t,u,v,w,x,A)|0;C=B;D=C;return D|0}function bx(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=bX(f,b,c,a)|0;d=d+(bW(f,f,a,e)|0)|0;return d|0}function by(a,b,d,e,f,g,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=a;a=b;b=d;d=f;f=g;g=h;h=i;i=j;j=e-f|0;b=b+(j<<2)|0;k=k+(j<<2)|0;e=(be(b,d,f)|0)>=0|0;if((e|0)!=0){l=a;m=b;n=d;o=f;bX(l,m,n,o)|0}else{if((f|0)!=0){o=f-1|0;n=a;m=b;l=m;m=l+4|0;p=c[l>>2]|0;if((o|0)!=0){do{l=n;n=l+4|0;c[l>>2]=p;l=m;m=l+4|0;p=c[l>>2]|0;l=o-1|0;o=l;}while((l|0)!=0)}o=n;n=o+4|0;c[o>>2]=p}}if((j|0)==0){q=e;r=q;return r|0}while(1){if((j|0)<=0){s=1702;break}if((j|0)<(h|0)){g=g+(h-j<<2)|0;h=j}b=b+(-h<<2)|0;k=k+(-h<<2)|0;bD(i,a+(f<<2)+(-h<<2)|0,g,h);p=bo(k,i+(h<<2)|0,a+(f<<2)+(-h<<2)|0,h)|0;if(((((p|0)==0^1)&1|0)!=0|0)!=0){s=1648;break}j=j-h|0;if((h|0)>=40){o=bI(f+1|0)|0;bF(i,o,d,f,k,h,i+(o<<2)|0);n=f+h-o|0;if((n|0)>0){p=bX(i,i,a+(f<<2)+(-n<<2)|0,n)|0;p=bW(i+(n<<2)|0,i+(n<<2)|0,o-n|0,p)|0;n=(be(a+(f<<2)+(-h<<2)|0,i+(f<<2)|0,o-f|0)|0)<0|0;if((((n>>>0>=p>>>0^1)&1|0)!=0|0)!=0){s=1655;break}o=i;m=(c[o>>2]|0)+(n-p)|0;c[o>>2]=m;if(m>>>0<(n-p|0)>>>0){do{n=o+4|0;o=n;m=(c[n>>2]|0)+1|0;c[n>>2]=m;}while((m|0)==0)}}}else{o=i;m=d;n=f;l=k;t=h;cu(o,m,n,l,t)|0}t=(c[a+(f-h<<2)>>2]|0)-(c[i+(f<<2)>>2]|0)|0;if((f|0)!=(h|0)){p=bX(i,b,i,h)|0;p=bx(i+(h<<2)|0,a,i+(h<<2)|0,f-h|0,p)|0;if((f|0)!=0){l=f-1|0;n=a;m=i;o=m;m=o+4|0;u=c[o>>2]|0;if((l|0)!=0){do{o=n;n=o+4|0;c[o>>2]=u;o=m;m=o+4|0;u=c[o>>2]|0;o=l-1|0;l=o;}while((o|0)!=0)}l=n;n=l+4|0;c[l>>2]=u}}else{p=bX(a,b,i,h)|0}t=t-p|0;while(1){if((t|0)==0){break}l=k;do{m=l;l=m+4|0;o=(c[m>>2]|0)+1|0;c[m>>2]=o;}while((o|0)==0);p=bX(a,a,d,f)|0;t=t-p|0}if((be(a,d,f)|0)>=0){t=k;do{u=t;t=u+4|0;n=(c[u>>2]|0)+1|0;c[u>>2]=n;}while((n|0)==0);p=bX(a,a,d,f)|0}}if((s|0)==1648){bh(136,280,624);return 0}else if((s|0)==1655){bh(136,300,304);return 0}else if((s|0)==1702){q=e;r=q;return r|0}return 0}function bz(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=c;if((b|0)!=0){if((a|0)<(d|0)){e=a}else{e=d}f=((e-1|0)/(b|0)|0)+1|0;g=f;return g|0}if((d|0)>(a|0)){f=((d-1|0)/(((d-1|0)/(a|0)|0)+1|0)|0)+1|0}else{if((d*3|0|0)>(a|0)){f=((d-1|0)/2|0)+1|0}else{f=((d-1|0)/1|0)+1|0}}g=f;return g|0}function bA(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=b;b=bI(d+1|0)|0;e=bz(a-d|0,d,c)|0;return e+b+(bB(b,d,e)|0)|0}function bB(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function bC(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=0;do{g=a;a=g+4|0;h=c[g>>2]|0;g=d;i=h&65535;j=h>>>16;h=g&65535;k=g>>>16;g=_(i,h)|0;l=_(i,k)|0;i=_(j,h)|0;h=_(j,k)|0;l=l+(g>>>16)|0;l=l+i|0;if(l>>>0<i>>>0){h=h+65536|0}i=(l<<16)+(g&65535)|0;i=i+e|0;e=(i>>>0<e>>>0)+(h+(l>>>16))|0;l=f;f=l+4|0;c[l>>2]=i;i=b-1|0;b=i;}while((i|0)!=0);return e|0}function bD(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+1056|0;g=f|0;h=f+1048|0;j=a;a=b;b=d;d=e;if((d|0)<30){cE(j,a,d,b,d);i=f;return}if((d|0)>=100){if((d|0)>=300){if((d|0)>=350){if((d|0)>=450){if((d|0)>=3e3){bJ(j,a,d,b,d)}else{c[h>>2]=0;if(((((d*15|0)>>3)-843+1282<<2>>>0<65536|0)!=0|0)!=0){e=i;i=i+(((d*15|0)>>3)-843+1282<<2)|0;i=i+7&-8;k=e}else{k=cs(h,((d*15|0)>>3)-843+1282<<2)|0}cc(j,a,d,b,d,k);if((((c[h>>2]|0)!=0|0)!=0|0)!=0){ct(c[h>>2]|0)}}}else{h=i;i=i+((d-350<<1)+1082<<2)|0;i=i+7&-8;ca(j,a,d,b,d,h)}}else{h=i;i=i+((d*3|0)+32<<2)|0;i=i+7&-8;b7(j,a,d,b,d,h)}}else{h=i;i=i+((d*3|0)+32<<2)|0;i=i+7&-8;b5(j,a,d,b,d,h)}}else{bZ(j,a,d,b,d,g|0)}i=f;return}function bE(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;a=e;e=f;bD(e,b,d,a);d=bo(g,e,e+(a<<2)|0,a)|0;a=g;g=(c[a>>2]|0)+d|0;c[a>>2]=g;if(g>>>0<d>>>0){do{d=a+4|0;a=d;g=(c[d>>2]|0)+1|0;c[d>>2]=g;}while((g|0)==0)}return}function bF(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;do{if((a&1|0)==0){if((a|0)<16){break}h=a>>1;j=e;k=f;if((((d|0)>(h|0)|0)!=0|0)!=0){l=g;m=a5(g,b,h,b+(h<<2)|0,d-h|0)|0;n=g;o=(c[n>>2]|0)+m|0;c[n>>2]=o;if(o>>>0<m>>>0){do{o=n+4|0;n=o;p=(c[o>>2]|0)+1|0;c[o>>2]=p;}while((p|0)==0)}q=h;r=g+(h<<2)|0;if((((f|0)>(h|0)|0)!=0|0)!=0){j=r;m=a5(r,e,h,e+(h<<2)|0,f-h|0)|0;n=r;p=(c[n>>2]|0)+m|0;c[n>>2]=p;if(p>>>0<m>>>0){do{p=n+4|0;n=p;o=(c[p>>2]|0)+1|0;c[p>>2]=o;}while((o|0)==0)}k=h;r=r+(h<<2)|0}}else{r=g;l=b;q=d}bF(i,h,l,q,j,k,r);n=e;o=f;if((((d|0)>(h|0)|0)!=0|0)!=0){s=g+(h<<1<<2)+8|0;m=a6(g+(h<<1<<2)+8|0,b,h,b+(h<<2)|0,d-h|0)|0;c[g+(h<<1<<2)+8+(h<<2)>>2]=0;p=g+(h<<1<<2)+8|0;t=(c[p>>2]|0)+m|0;c[p>>2]=t;if(t>>>0<m>>>0){do{t=p+4|0;p=t;u=(c[t>>2]|0)+1|0;c[t>>2]=u;}while((u|0)==0)}v=h+(c[s+(h<<2)>>2]|0)|0;if((((f|0)>(h|0)|0)!=0|0)!=0){n=g+(h<<1<<2)+8+(h<<2)+4|0;m=a6(g+(h<<1<<2)+8+(h<<2)+4|0,e,h,e+(h<<2)|0,f-h|0)|0;c[g+(h<<1<<2)+8+((h<<1)+1<<2)>>2]=0;p=g+(h<<1<<2)+8+(h<<2)+4|0;k=(c[p>>2]|0)+m|0;c[p>>2]=k;if(k>>>0<m>>>0){do{k=p+4|0;p=k;j=(c[k>>2]|0)+1|0;c[k>>2]=j;}while((j|0)==0)}o=h+(c[n+(h<<2)>>2]|0)|0}}else{s=b;v=d}if((h|0)>=300){w=cF(h,0)|0;p=(1<<w)-1|0;while(1){if((h&p|0)==0){break}w=w-1|0;p=p>>1}}else{w=0}if((w|0)>=4){c[g+(h<<2)>>2]=cH(g,h,s,v,n,o,w)|0}else{if((((n|0)==(e|0)|0)!=0|0)!=0){p=g;j=s;k=v;u=n;t=o;cu(p,j,k,u,t)|0;v=v+o-h|0;v=v-((v|0)>(h|0))|0;m=a6(g,g,h,g+(h<<2)|0,v)|0;c[g+(h<<2)>>2]=0;t=g;u=(c[t>>2]|0)+m|0;c[t>>2]=u;if(u>>>0<m>>>0){do{u=t+4|0;t=u;k=(c[u>>2]|0)+1|0;c[u>>2]=k;}while((k|0)==0)}}else{bG(g,s,n,h,g)}}t=c[g+(h<<2)>>2]|0;m=t+(bo(i,i,g,h)|0)|0;m=m+(c[i>>2]&1)|0;t=i;o=i;k=h;bN(t,o,k,1)|0;k=m<<31;m=m>>>1;o=i+(h-1<<2)|0;c[o>>2]=c[o>>2]|k;k=i;o=(c[k>>2]|0)+m|0;c[k>>2]=o;if(o>>>0<m>>>0){do{o=k+4|0;k=o;t=(c[o>>2]|0)+1|0;c[o>>2]=t;}while((t|0)==0)}if((((d+f|0)<(a|0)|0)!=0|0)!=0){m=bX(i+(h<<2)|0,i,g,d+f-h|0)|0;k=c[g+(h<<2)>>2]|0;m=k+(bH(g+(d<<2)+(f<<2)+(-h<<2)|0,i+(d<<2)+(f<<2)+(-h<<2)|0,g+(d<<2)+(f<<2)+(-h<<2)|0,a-(d+f)|0,m)|0)|0;m=bW(i,i,d+f|0,m)|0}else{k=c[g+(h<<2)>>2]|0;m=k+(bX(i+(h<<2)|0,i,g,h)|0)|0;k=i;n=c[k>>2]|0;c[k>>2]=n-m;if(n>>>0<m>>>0){do{n=k+4|0;k=n;t=c[n>>2]|0;c[n>>2]=t-1;}while((t|0)==0)}}return}}while(0);if((((f|0)<(a|0)|0)!=0|0)!=0){if((((d+f|0)<=(a|0)|0)!=0|0)!=0){m=i;s=b;v=d;w=e;r=f;cu(m,s,v,w,r)|0}else{r=g;w=b;v=d;s=e;m=f;cu(r,w,v,s,m)|0;m=a5(i,g,a,g+(a<<2)|0,d+f-a|0)|0;f=i;d=(c[f>>2]|0)+m|0;c[f>>2]=d;if(d>>>0<m>>>0){do{m=f+4|0;f=m;d=(c[m>>2]|0)+1|0;c[m>>2]=d;}while((d|0)==0)}}}else{bE(i,b,e,a,g)}return}function bG(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;a=e;e=f;bD(e,b,d,a+1|0);d=c[e+(a<<1<<2)>>2]|0;b=d+(bX(g,e,e+(a<<2)|0,a)|0)|0;c[g+(a<<2)>>2]=0;a=g;g=(c[a>>2]|0)+b|0;c[a>>2]=g;if(g>>>0<b>>>0){do{b=a+4|0;a=b;g=(c[b>>2]|0)+1|0;c[b>>2]=g;}while((g|0)==0)}return}function bH(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=bX(f,b,c,a)|0;d=d+(bW(f,f,a,e)|0)|0;return d|0}function bI(a){a=a|0;var b=0,c=0;b=a;do{if((b|0)>=16){if((b|0)<61){c=b+1&-2;break}if((b|0)<121){c=b+3&-4;break}a=b+1>>1;if((a|0)>=300){c=(cG(a,cF(a,0)|0)|0)<<1;break}else{c=b+7&-8;break}}else{c=b}}while(0);return c|0}function bJ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=a;a=b;b=d;d=e;e=f;c[h>>2]=0;do{if((a|0)==(d|0)){if((b|0)!=(e|0)){k=1944;break}l=bV(b<<1)|0;if((((bK(l,b)|0)<<2>>>0<65536|0)!=0|0)!=0){f=(bK(l,b)|0)<<2;m=i;i=i+f|0;i=i+7&-8;n=m}else{n=cs(h,(bK(l,b)|0)<<2)|0}o=n;bR(j,l,a,b,o)}else{k=1944}}while(0);if((k|0)==1944){l=bI(b+e|0)|0;if((((bL(l,b,e)|0)<<2>>>0<65536|0)!=0|0)!=0){k=(bL(l,b,e)|0)<<2;n=i;i=i+k|0;i=i+7&-8;p=n}else{p=cs(h,(bL(l,b,e)|0)<<2)|0}o=p;bF(j,l,a,b,d,e,o)}if((((c[h>>2]|0)!=0|0)!=0|0)!=0){ct(c[h>>2]|0)}i=g;return}function bK(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((a|0)>(c>>1|0)){d=a}else{d=0}return c+3+d|0}function bL(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function bM(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=c[b+(d-1<<2)>>2]|0;j=e<<g;i=i+(d+a-1<<2)|0;L2448:do{if((g|0)==0){k=h;l=k>>>0>=j>>>0|0;if((l|0)!=0){m=k-j|0}else{m=k}k=m;n=i;i=n-4|0;c[n>>2]=l;d=d-1|0;o=d-1|0;while(1){if((o|0)<0){break}p=c[b+(o<<2)>>2]|0;l=k;n=f;q=l&65535;r=l>>>16;l=n&65535;s=n>>>16;n=_(q,l)|0;t=_(q,s)|0;q=_(r,l)|0;l=_(r,s)|0;t=t+(n>>>16)|0;t=t+q|0;if(t>>>0<q>>>0){l=l+65536|0}q=l+(t>>>16)|0;l=(t<<16)+(n&65535)|0;n=l+p|0;q=q+(k+1)+(n>>>0<l>>>0)|0;l=n;n=p-(_(q,j)|0)|0;t=-(n>>>0>l>>>0|0)|0;q=q+t|0;n=n+(t&j)|0;if(((n>>>0>=j>>>0|0)!=0|0)!=0){n=n-j|0;q=q+1|0}k=n;c[i>>2]=q;i=i-4|0;o=o-1|0}u=2022}else{k=0;do{if(h>>>0<e>>>0){k=h<<g;q=i;i=q-4|0;c[q>>2]=0;d=d-1|0;if((d|0)==0){break L2448}else{break}}}while(0);q=c[b+(d-1<<2)>>2]|0;k=k|q>>>((32-g|0)>>>0);o=d-2|0;while(1){if((o|0)<0){break}p=c[b+(o<<2)>>2]|0;n=k;t=f;l=n&65535;s=n>>>16;n=t&65535;r=t>>>16;t=_(l,n)|0;v=_(l,r)|0;l=_(s,n)|0;n=_(s,r)|0;v=v+(t>>>16)|0;v=v+l|0;if(v>>>0<l>>>0){n=n+65536|0}l=n+(v>>>16)|0;n=(v<<16)+(t&65535)|0;t=n+(q<<g|p>>>((32-g|0)>>>0))|0;l=l+(k+1)+(t>>>0<n>>>0)|0;n=t;t=(q<<g|p>>>((32-g|0)>>>0))-(_(l,j)|0)|0;v=-(t>>>0>n>>>0|0)|0;l=l+v|0;t=t+(v&j)|0;if(((t>>>0>=j>>>0|0)!=0|0)!=0){t=t-j|0;l=l+1|0}k=t;c[i>>2]=l;i=i-4|0;q=p;o=o-1|0}l=k;t=f;v=l&65535;n=l>>>16;l=t&65535;r=t>>>16;t=_(v,l)|0;s=_(v,r)|0;v=_(n,l)|0;l=_(n,r)|0;s=s+(t>>>16)|0;s=s+v|0;if(s>>>0<v>>>0){l=l+65536|0}v=l+(s>>>16)|0;l=(s<<16)+(t&65535)|0;t=l+(q<<g)|0;v=v+(k+1)+(t>>>0<l>>>0)|0;l=t;t=(q<<g)-(_(v,j)|0)|0;s=-(t>>>0>l>>>0|0)|0;v=v+s|0;t=t+(s&j)|0;if(((t>>>0>=j>>>0|0)!=0|0)!=0){t=t-j|0;v=v+1|0}k=t;c[i>>2]=v;i=i-4|0;u=2022}}while(0);o=0;while(1){if((o|0)>=(a|0)){break}u=k;p=f;b=u&65535;d=u>>>16;u=p&65535;h=p>>>16;p=_(b,u)|0;e=_(b,h)|0;b=_(d,u)|0;u=_(d,h)|0;e=e+(p>>>16)|0;e=e+b|0;if(e>>>0<b>>>0){u=u+65536|0}b=u+(e>>>16)|0;b=b+(k+1)|0;u=_(-b|0,j)|0;h=-(u>>>0>((e<<16)+(p&65535)|0)>>>0|0)|0;b=b+h|0;u=u+(h&j)|0;k=u;c[i>>2]=b;i=i-4|0;o=o+1|0}return k>>>(g>>>0)|0}function bN(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=e;e=32-b|0;g=a;a=g+4|0;h=c[g>>2]|0;g=h<<e;i=h>>>(b>>>0);j=d-1|0;while(1){if((j|0)==0){break}d=a;a=d+4|0;h=c[d>>2]|0;d=f;f=d+4|0;c[d>>2]=i|h<<e;i=h>>>(b>>>0);j=j-1|0}c[f>>2]=i;return g|0}function bO(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=a;a=b;b=d;d=e;e=f;f=g;a=a+(b<<2)|0;g=(be(a+(-e<<2)|0,d,e)|0)>=0|0;if((g|0)!=0){i=a+(-e<<2)|0;j=a+(-e<<2)|0;k=d;l=e;bX(i,j,k,l)|0}h=h+(b-e<<2)|0;e=e-2|0;l=c[d+(e+1<<2)>>2]|0;k=c[d+(e<<2)>>2]|0;a=a-8|0;j=c[a+4>>2]|0;i=b-(e+2)|0;while(1){if((i|0)<=0){break}a=a-4|0;do{if((((j|0)==(l|0)|0)!=0|0)!=0){if((c[a+4>>2]|0)!=(k|0)){m=2060;break}n=-1;b=a+(-e<<2)|0;o=d;p=e+2|0;q=n;bY(b,o,p,q)|0;j=c[a+4>>2]|0}else{m=2060}}while(0);if((m|0)==2060){m=0;q=j;p=f;o=q&65535;b=q>>>16;q=p&65535;r=p>>>16;p=_(o,q)|0;s=_(o,r)|0;o=_(b,q)|0;q=_(b,r)|0;s=s+(p>>>16)|0;s=s+o|0;if(s>>>0<o>>>0){q=q+65536|0}n=q+(s>>>16)|0;q=(s<<16)+(p&65535)|0;p=q+(c[a+4>>2]|0)|0;n=n+j+(p>>>0<q>>>0)|0;q=p;p=c[a+4>>2]|0;j=p-(_(l,n)|0)|0;j=j-l-((c[a>>2]|0)>>>0<k>>>0)|0;p=(c[a>>2]|0)-k|0;s=k;o=n;r=s&65535;b=s>>>16;s=o&65535;t=o>>>16;o=_(r,s)|0;u=_(r,t)|0;r=_(b,s)|0;s=_(b,t)|0;u=u+(o>>>16)|0;u=u+r|0;if(u>>>0<r>>>0){s=s+65536|0}r=(u<<16)+(o&65535)|0;j=j-(s+(u>>>16))-(p>>>0<r>>>0)|0;p=p-r|0;n=n+1|0;r=-(j>>>0>=q>>>0|0)|0;n=n+r|0;q=p+(r&k)|0;j=j+(r&l)+(q>>>0<p>>>0)|0;p=q;if(((j>>>0>=l>>>0|0)!=0|0)!=0){if(j>>>0>l>>>0){m=2080}else{if(p>>>0>=k>>>0){m=2080}}if((m|0)==2080){m=0;n=n+1|0;j=j-l-(p>>>0<k>>>0)|0;p=p-k|0}}q=bY(a+(-e<<2)|0,d,e,n)|0;r=p>>>0<q>>>0|0;p=p-q|0;q=j>>>0<r>>>0|0;j=j-r|0;c[a>>2]=p;if((((q|0)!=0|0)!=0|0)!=0){j=j+(l+(bo(a+(-e<<2)|0,a+(-e<<2)|0,d,e+1|0)|0))|0;n=n-1|0}}q=h-4|0;h=q;c[q>>2]=n;i=i-1|0}c[a+4>>2]=j;return g|0}function bP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+1216|0;f=e|0;g=e+1208|0;h=a;a=b;b=d;if((b|0)<50){bQ(h,a,b);i=e;return}if((b|0)>=120){if((b|0)>=400){if((b|0)>=350){if((b|0)>=450){if((b|0)>=3600){bJ(h,a,b,a,b)}else{c[g>>2]=0;if(((((b*15|0)>>3)-843+1282<<2>>>0<65536|0)!=0|0)!=0){d=i;i=i+(((b*15|0)>>3)-843+1282<<2)|0;i=i+7&-8;j=d}else{j=cs(g,((b*15|0)>>3)-843+1282<<2)|0}cb(h,a,b,j);if((((c[g>>2]|0)!=0|0)!=0|0)!=0){ct(c[g>>2]|0)}}}else{g=i;i=i+((b-350<<1)+1082<<2)|0;i=i+7&-8;b9(h,a,b,g)}}else{g=i;i=i+((b*3|0)+32<<2)|0;i=i+7&-8;b8(h,a,b,g)}}else{g=i;i=i+((b*3|0)+32<<2)|0;i=i+7&-8;b6(h,a,b,g)}}else{b$(h,a,b,f|0)}i=e;return}function bQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+400|0;f=a;a=b;b=d;d=c[a>>2]|0;g=d;h=d<<0;d=g&65535;j=g>>>16;g=h&65535;k=h>>>16;h=_(d,g)|0;l=_(d,k)|0;d=_(j,g)|0;g=_(j,k)|0;l=l+(h>>>16)|0;l=l+d|0;if(l>>>0<d>>>0){g=g+65536|0}c[f+4>>2]=g+(l>>>16);c[f>>2]=((l<<16)+(h&65535)|0)>>>0;if((b|0)<=1){i=e;return}h=e|0;c[h+(b-1<<2)>>2]=bC(h,a+4|0,b-1|0,c[a>>2]|0)|0;l=2;while(1){if((l|0)>=(b|0)){break}c[h+(b+l-2<<2)>>2]=cx(h+(l<<1<<2)-8|0,a+(l<<2)|0,b-l|0,c[a+(l-1<<2)>>2]|0)|0;l=l+1|0}l=0;while(1){if((l|0)>=(b|0)){break}g=c[a+(l<<2)>>2]|0;d=g;k=g<<0;g=d&65535;j=d>>>16;d=k&65535;m=k>>>16;k=_(g,d)|0;n=_(g,m)|0;g=_(j,d)|0;d=_(j,m)|0;n=n+(k>>>16)|0;n=n+g|0;if(n>>>0<g>>>0){d=d+65536|0}c[f+((l<<1)+1<<2)>>2]=d+(n>>>16);c[f+(l<<1<<2)>>2]=((n<<16)+(k&65535)|0)>>>0;l=l+1|0}l=bu(h,h,(b<<1)-2|0,1)|0;l=l+(bo(f+4|0,f+4|0,h,(b<<1)-2|0)|0)|0;h=f+((b<<1)-1<<2)|0;c[h>>2]=(c[h>>2]|0)+l;i=e;return}function bR(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=a;a=b;b=d;d=e;e=f;do{if((a&1|0)==0){if((a|0)<16){break}f=a>>1;if((((d|0)>(f|0)|0)!=0|0)!=0){h=e+(f<<2)|0;i=e;j=a5(e,b,f,b+(f<<2)|0,d-f|0)|0;k=e;l=(c[k>>2]|0)+j|0;c[k>>2]=l;if(l>>>0<j>>>0){do{l=k+4|0;k=l;m=(c[l>>2]|0)+1|0;c[l>>2]=m;}while((m|0)==0)}n=f}else{h=e;i=b;n=d}bR(g,f,i,n,h);if((((d|0)>(f|0)|0)!=0|0)!=0){o=e+(f<<1<<2)+8|0;j=a6(e+(f<<1<<2)+8|0,b,f,b+(f<<2)|0,d-f|0)|0;c[e+(f<<1<<2)+8+(f<<2)>>2]=0;k=e+(f<<1<<2)+8|0;m=(c[k>>2]|0)+j|0;c[k>>2]=m;if(m>>>0<j>>>0){do{m=k+4|0;k=m;l=(c[m>>2]|0)+1|0;c[m>>2]=l;}while((l|0)==0)}p=f+(c[o+(f<<2)>>2]|0)|0}else{o=b;p=d}if((f|0)>=300){q=cF(f,1)|0;k=(1<<q)-1|0;while(1){if((f&k|0)==0){break}q=q-1|0;k=k>>1}}else{q=0}if((q|0)>=4){c[e+(f<<2)>>2]=cH(e,f,o,p,o,p,q)|0}else{if((((o|0)==(b|0)|0)!=0|0)!=0){bP(e,b,d);p=(d<<1)-f|0;j=a6(e,e,f,e+(f<<2)|0,p)|0;c[e+(f<<2)>>2]=0;k=e;l=(c[k>>2]|0)+j|0;c[k>>2]=l;if(l>>>0<j>>>0){do{l=k+4|0;k=l;m=(c[l>>2]|0)+1|0;c[l>>2]=m;}while((m|0)==0)}}else{bT(e,o,f,e)}}k=c[e+(f<<2)>>2]|0;j=k+(bo(g,g,e,f)|0)|0;j=j+(c[g>>2]&1)|0;k=g;m=g;l=f;bN(k,m,l,1)|0;l=j<<31;j=j>>>1;m=g+(f-1<<2)|0;c[m>>2]=c[m>>2]|l;l=g;m=(c[l>>2]|0)+j|0;c[l>>2]=m;if(m>>>0<j>>>0){do{m=l+4|0;l=m;k=(c[m>>2]|0)+1|0;c[m>>2]=k;}while((k|0)==0)}if((((d<<1|0)<(a|0)|0)!=0|0)!=0){j=bX(g+(f<<2)|0,g,e,(d<<1)-f|0)|0;l=c[e+(f<<2)>>2]|0;j=l+(bU(e+(d<<1<<2)+(-f<<2)|0,g+(d<<1<<2)+(-f<<2)|0,e+(d<<1<<2)+(-f<<2)|0,a-(d<<1)|0,j)|0)|0;j=bW(g,g,d<<1,j)|0}else{l=c[e+(f<<2)>>2]|0;j=l+(bX(g+(f<<2)|0,g,e,f)|0)|0;l=g;k=c[l>>2]|0;c[l>>2]=k-j;if(k>>>0<j>>>0){do{k=l+4|0;l=k;m=c[k>>2]|0;c[k>>2]=m-1;}while((m|0)==0)}}return}}while(0);if((((d|0)<(a|0)|0)!=0|0)!=0){if((((d<<1|0)<=(a|0)|0)!=0|0)!=0){bP(g,b,d)}else{bP(e,b,d);j=a5(g,e,a,e+(a<<2)|0,(d<<1)-a|0)|0;d=g;o=(c[d>>2]|0)+j|0;c[d>>2]=o;if(o>>>0<j>>>0){do{j=d+4|0;d=j;o=(c[j>>2]|0)+1|0;c[j>>2]=o;}while((o|0)==0)}}}else{bS(g,b,a,e)}return}function bS(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=e;bP(d,b,a);b=bo(f,d,d+(a<<2)|0,a)|0;a=f;f=(c[a>>2]|0)+b|0;c[a>>2]=f;if(f>>>0<b>>>0){do{b=a+4|0;a=b;f=(c[b>>2]|0)+1|0;c[b>>2]=f;}while((f|0)==0)}return}function bT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=e;bP(d,b,a+1|0);b=c[d+(a<<1<<2)>>2]|0;e=b+(bX(f,d,d+(a<<2)|0,a)|0)|0;c[f+(a<<2)>>2]=0;a=f;f=(c[a>>2]|0)+e|0;c[a>>2]=f;if(f>>>0<e>>>0){do{e=a+4|0;a=e;f=(c[e>>2]|0)+1|0;c[e>>2]=f;}while((f|0)==0)}return}function bU(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=bX(f,b,c,a)|0;d=d+(bW(f,f,a,e)|0)|0;return d|0}function bV(a){a=a|0;var b=0,c=0;b=a;do{if((b|0)>=16){if((b|0)<61){c=b+1&-2;break}if((b|0)<121){c=b+3&-4;break}a=b+1>>1;if((a|0)>=360){c=(cG(a,cF(a,1)|0)|0)<<1;break}else{c=b+7&-8;break}}else{c=b}}while(0);return c|0}function bW(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=c[a>>2]|0;g=e-d|0;c[f>>2]=g;if(e>>>0<d>>>0){h=1;d=1;while(1){if((d|0)>=(b|0)){break}e=c[a+(d<<2)>>2]|0;g=e-1|0;c[f+(d<<2)>>2]=g;d=d+1|0;if(e>>>0>=1){i=2294;break}}if((i|0)==2294){if((a|0)!=(f|0)){i=d;while(1){if((i|0)>=(b|0)){break}c[f+(i<<2)>>2]=c[a+(i<<2)>>2];i=i+1|0}}h=0}}else{if((a|0)!=(f|0)){i=1;while(1){if((i|0)>=(b|0)){break}c[f+(i<<2)>>2]=c[a+(i<<2)>>2];i=i+1|0}}h=0}return h|0}function bX(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=0;do{g=a;a=g+4|0;h=c[g>>2]|0;g=b;b=g+4|0;i=h-(c[g>>2]|0)|0;g=i-e|0;e=i>>>0>h>>>0|g>>>0>i>>>0;i=f;f=i+4|0;c[i>>2]=g;g=d-1|0;d=g;}while((g|0)!=0);return e|0}function bY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=0;do{g=a;a=g+4|0;h=c[g>>2]|0;g=d;i=h&65535;j=h>>>16;h=g&65535;k=g>>>16;g=_(i,h)|0;l=_(i,k)|0;i=_(j,h)|0;h=_(j,k)|0;l=l+(g>>>16)|0;l=l+i|0;if(l>>>0<i>>>0){h=h+65536|0}i=(l<<16)+(g&65535)|0;i=i+e|0;e=(i>>>0<e>>>0)+(h+(l>>>16))|0;l=c[f>>2]|0;i=l-i|0;e=e+(i>>>0>l>>>0)|0;l=f;f=l+4|0;c[l>>2]=i;i=b-1|0;b=i;}while((i|0)!=0);return e|0}function bZ(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=a;a=b;b=d;d=e;e=g;g=b>>1;i=b-g|0;b=f-i|0;f=h;j=h+(i<<2)|0;k=0;if((g|0)==(i|0)){if((be(a,a+(i<<2)|0,i)|0)<0){l=f;m=a+(i<<2)|0;n=a;o=i;bX(l,m,n,o)|0;k=1}else{o=f;n=a;m=a+(i<<2)|0;l=i;bX(o,n,m,l)|0}}else{do{if((b_(a+(g<<2)|0,i-g|0)|0)!=0){if((be(a,a+(i<<2)|0,g)|0)>=0){p=2361;break}l=f;m=a+(i<<2)|0;n=a;o=g;bX(l,m,n,o)|0;if((i-g|0)!=0){o=f+(g<<2)|0;n=i-g|0;do{m=o;o=m+4|0;c[m>>2]=0;m=n-1|0;n=m;}while((m|0)!=0)}k=1}else{p=2361}}while(0);if((p|0)==2361){n=f;o=a;m=i;l=a+(i<<2)|0;q=g;a6(n,o,m,l,q)|0}}if((b|0)==(i|0)){if((be(d,d+(i<<2)|0,i)|0)<0){q=j;l=d+(i<<2)|0;m=d;o=i;bX(q,l,m,o)|0;k=k^1}else{o=j;m=d;l=d+(i<<2)|0;q=i;bX(o,m,l,q)|0}}else{do{if((b_(d+(b<<2)|0,i-b|0)|0)!=0){if((be(d,d+(i<<2)|0,b)|0)>=0){p=2380;break}q=j;l=d+(i<<2)|0;m=d;o=b;bX(q,l,m,o)|0;if((i-b|0)!=0){o=j+(b<<2)|0;m=i-b|0;do{l=o;o=l+4|0;c[l>>2]=0;l=m-1|0;m=l;}while((l|0)!=0)}k=k^1}else{p=2380}}while(0);if((p|0)==2380){p=j;m=d;o=i;l=d+(i<<2)|0;q=b;a6(p,m,o,l,q)|0}}if((i|0)>=30){bZ(e,f,i,j,i,e+(i<<1<<2)|0)}else{cE(e,f,i,j,i)}if((g|0)>(b|0)){if((b|0)>=30){if((g<<2|0)<(b*5|0|0)){bZ(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,b,e+(i<<1<<2)|0)}else{b1(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,b,e+(i<<1<<2)|0)}}else{cE(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,b)}}else{if((g|0)>=30){bZ(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,g,e+(i<<1<<2)|0)}else{cE(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,g)}}if((i|0)>=30){bZ(h,a,i,d,i,e+(i<<1<<2)|0)}else{cE(h,a,i,d,i)}d=bo(h+(i<<1<<2)|0,h+(i<<2)|0,h+(i<<1<<2)|0,i)|0;a=d+(bo(h+(i<<2)|0,h+(i<<1<<2)|0,h,i)|0)|0;d=d+(a5(h+(i<<1<<2)|0,h+(i<<1<<2)|0,i,h+(i<<1<<2)+(i<<2)|0,g+b-i|0)|0)|0;if((k|0)!=0){d=d+(bo(h+(i<<2)|0,h+(i<<2)|0,e,i<<1)|0)|0}else{d=d-(bX(h+(i<<2)|0,h+(i<<2)|0,e,i<<1)|0)|0}e=h+(i<<1<<2)|0;k=(c[e>>2]|0)+a|0;c[e>>2]=k;if(k>>>0<a>>>0){do{a=e+4|0;e=a;k=(c[a>>2]|0)+1|0;c[a>>2]=k;}while((k|0)==0)}if(((d>>>0<=2|0)!=0|0)==0){e=h+((i*3|0)<<2)|0;do{k=e;e=k+4|0;a=c[k>>2]|0;c[k>>2]=a-1;}while((a|0)==0);return}e=h+((i*3|0)<<2)|0;i=(c[e>>2]|0)+d|0;c[e>>2]=i;if(i>>>0<d>>>0){do{d=e+4|0;e=d;i=(c[d>>2]|0)+1|0;c[d>>2]=i;}while((i|0)==0)}return}function b_(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;while(1){b=a-1|0;a=b;if((b|0)<0){e=2445;break}if((c[d+(a<<2)>>2]|0)!=0){e=2443;break}}if((e|0)==2443){f=0;g=f;return g|0}else if((e|0)==2445){f=1;g=f;return g|0}return 0}function b$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=b>>1;g=b-e|0;b=f;if((e|0)==(g|0)){if((be(a,a+(g<<2)|0,g)|0)<0){h=b;i=a+(g<<2)|0;j=a;k=g;bX(h,i,j,k)|0}else{k=b;j=a;i=a+(g<<2)|0;h=g;bX(k,j,i,h)|0}}else{do{if((b0(a+(e<<2)|0,g-e|0)|0)!=0){if((be(a,a+(g<<2)|0,e)|0)>=0){l=2468;break}h=b;i=a+(g<<2)|0;j=a;k=e;bX(h,i,j,k)|0;if((g-e|0)!=0){k=b+(e<<2)|0;j=g-e|0;do{i=k;k=i+4|0;c[i>>2]=0;i=j-1|0;j=i;}while((i|0)!=0)}}else{l=2468}}while(0);if((l|0)==2468){l=b;j=a;k=g;i=a+(g<<2)|0;h=e;a6(l,j,k,i,h)|0}}if((g|0)>=50){b$(d,b,g,d+(g<<1<<2)|0)}else{bQ(d,b,g)}if((e|0)>=50){b$(f+(g<<1<<2)|0,a+(g<<2)|0,e,d+(g<<1<<2)|0)}else{bQ(f+(g<<1<<2)|0,a+(g<<2)|0,e)}if((g|0)>=50){b$(f,a,g,d+(g<<1<<2)|0)}else{bQ(f,a,g)}a=bo(f+(g<<1<<2)|0,f+(g<<2)|0,f+(g<<1<<2)|0,g)|0;b=a+(bo(f+(g<<2)|0,f+(g<<1<<2)|0,f,g)|0)|0;a=a+(a5(f+(g<<1<<2)|0,f+(g<<1<<2)|0,g,f+(g<<1<<2)+(g<<2)|0,e+e-g|0)|0)|0;a=a-(bX(f+(g<<2)|0,f+(g<<2)|0,d,g<<1)|0)|0;d=f+(g<<1<<2)|0;e=(c[d>>2]|0)+b|0;c[d>>2]=e;if(e>>>0<b>>>0){do{b=d+4|0;d=b;e=(c[b>>2]|0)+1|0;c[b>>2]=e;}while((e|0)==0)}if(((a>>>0<=2|0)!=0|0)==0){d=f+((g*3|0)<<2)|0;do{e=d;d=e+4|0;b=c[e>>2]|0;c[e>>2]=b-1;}while((b|0)==0);return}d=f+((g*3|0)<<2)|0;g=(c[d>>2]|0)+a|0;c[d>>2]=g;if(g>>>0<a>>>0){do{a=d+4|0;d=a;g=(c[a>>2]|0)+1|0;c[a>>2]=g;}while((g|0)==0)}return}function b0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;while(1){b=a-1|0;a=b;if((b|0)<0){e=2519;break}if((c[d+(a<<2)>>2]|0)!=0){e=2517;break}}if((e|0)==2517){f=0;g=f;return g|0}else if((e|0)==2519){f=1;g=f;return g|0}return 0}function b1(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=a;a=b;b=d;d=e;e=f;f=g;if((b<<1|0)>=(e*3|0|0)){i=((b-1|0)>>>0)/3|0}else{i=e-1>>1}g=i+1|0;i=b-(g<<1)|0;b=e-g|0;e=a5(h,a,g,a+(g<<1<<2)|0,i)|0;do{if((e|0)==0){if((be(h,a+(g<<2)|0,g)|0)>=0){j=2537;break}k=h+(g<<1<<2)|0;l=a+(g<<2)|0;m=h;n=g;bX(k,l,m,n)|0;o=0;p=1}else{j=2537}}while(0);if((j|0)==2537){o=e-(bX(h+(g<<1<<2)|0,h,a+(g<<2)|0,g)|0)|0;p=0}e=e+(bo(h,h,a+(g<<2)|0,g)|0)|0;if((b|0)==(g|0)){q=bo(h+(g<<2)|0,d,d+(g<<2)|0,g)|0;if((be(d,d+(g<<2)|0,g)|0)<0){n=h+((g*3|0)<<2)|0;m=d+(g<<2)|0;l=d;k=g;bX(n,m,l,k)|0;p=p^1}else{k=h+((g*3|0)<<2)|0;l=d;m=d+(g<<2)|0;n=g;bX(k,l,m,n)|0}}else{q=a5(h+(g<<2)|0,d,g,d+(g<<2)|0,b)|0;do{if((b2(d+(b<<2)|0,g-b|0)|0)!=0){if((be(d,d+(g<<2)|0,b)|0)>=0){j=2555;break}n=h+((g*3|0)<<2)|0;m=d+(g<<2)|0;l=d;k=b;bX(n,m,l,k)|0;if((g-b|0)!=0){k=h+((g*3|0)<<2)+(b<<2)|0;l=g-b|0;do{m=k;k=m+4|0;c[m>>2]=0;m=l-1|0;l=m;}while((m|0)!=0)}p=p^1}else{j=2555}}while(0);if((j|0)==2555){j=h+((g*3|0)<<2)|0;l=d;k=g;m=d+(g<<2)|0;n=b;a6(j,l,k,m,n)|0}}bD(f,h,h+(g<<2)|0,g);if((e|0)==1){r=q+(bo(f+(g<<2)|0,f+(g<<2)|0,h+(g<<2)|0,g)|0)|0}else{if((e|0)==2){r=(q<<1)+(cx(f+(g<<2)|0,h+(g<<2)|0,g,2)|0)|0}else{r=0}}if((q|0)!=0){r=r+(bo(f+(g<<2)|0,f+(g<<2)|0,h,g)|0)|0}c[f+(g<<1<<2)>>2]=r;bD(h,h+(g<<1<<2)|0,h+((g*3|0)<<2)|0,g);if((o|0)!=0){o=bo(h+(g<<2)|0,h+(g<<2)|0,h+((g*3|0)<<2)|0,g)|0}c[h+(g<<1<<2)>>2]=o;if((p|0)!=0){q=f;e=f;n=h;m=(g<<1)+1|0;bX(q,e,n,m)|0;m=f;n=f;e=(g<<1)+1|0;bN(m,n,e,1)|0}else{e=f;n=f;m=h;q=(g<<1)+1|0;bo(e,n,m,q)|0;q=f;m=f;n=(g<<1)+1|0;bN(q,m,n,1)|0}o=c[h+(g<<1<<2)>>2]|0;r=bo(h+(g<<1<<2)|0,f,f+(g<<2)|0,g)|0;n=f+(g<<2)|0;m=(c[n>>2]|0)+(r+(c[f+(g<<1<<2)>>2]|0))|0;c[n>>2]=m;if(m>>>0<(r+(c[f+(g<<1<<2)>>2]|0)|0)>>>0){do{m=n+4|0;n=m;q=(c[m>>2]|0)+1|0;c[m>>2]=q;}while((q|0)==0)}if((p|0)!=0){r=bo(f,f,h,g)|0;o=o+(b3(h+(g<<1<<2)|0,h+(g<<1<<2)|0,h+(g<<2)|0,g,r)|0)|0;p=f+(g<<2)|0;n=(c[p>>2]|0)+o|0;c[p>>2]=n;if(n>>>0<o>>>0){do{n=p+4|0;p=n;q=(c[n>>2]|0)+1|0;c[n>>2]=q;}while((q|0)==0)}}else{r=bX(f,f,h,g)|0;o=o+(b4(h+(g<<1<<2)|0,h+(g<<1<<2)|0,h+(g<<2)|0,g,r)|0)|0;p=f+(g<<2)|0;q=c[p>>2]|0;c[p>>2]=q-o;if(q>>>0<o>>>0){do{q=p+4|0;p=q;n=c[q>>2]|0;c[q>>2]=n-1;}while((n|0)==0)}}bD(h,a,d,g);if((i|0)>(b|0)){p=h+((g*3|0)<<2)|0;n=a+(g<<1<<2)|0;q=i;m=d+(g<<2)|0;e=b;cu(p,n,q,m,e)|0}else{e=h+((g*3|0)<<2)|0;m=d+(g<<2)|0;d=b;q=a+(g<<1<<2)|0;a=i;cu(e,m,d,q,a)|0}r=bX(h+(g<<2)|0,h+(g<<2)|0,h+((g*3|0)<<2)|0,g)|0;o=(c[f+(g<<1<<2)>>2]|0)+r|0;r=b4(h+(g<<1<<2)|0,h+(g<<1<<2)|0,h,g,r)|0;o=o-(b4(h+((g*3|0)<<2)|0,f+(g<<2)|0,h+(g<<2)|0,g,r)|0)|0;o=o+(a5(h+(g<<2)|0,h+(g<<2)|0,g*3|0,f,g)|0)|0;if((((i+b|0)>(g|0)|0)!=0|0)==0){return}o=o-(a6(h+(g<<1<<2)|0,h+(g<<1<<2)|0,g<<1,h+(g<<2<<2)|0,i+b-g|0)|0)|0;if((o|0)<0){b=h+(g<<2<<2)|0;i=c[b>>2]|0;c[b>>2]=i-(-o|0);if(i>>>0<(-o|0)>>>0){do{i=b+4|0;b=i;f=c[i>>2]|0;c[i>>2]=f-1;}while((f|0)==0)}}else{b=h+(g<<2<<2)|0;g=(c[b>>2]|0)+o|0;c[b>>2]=g;if(g>>>0<o>>>0){do{o=b+4|0;b=o;g=(c[o>>2]|0)+1|0;c[o>>2]=g;}while((g|0)==0)}}return}function b2(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;while(1){b=a-1|0;a=b;if((b|0)<0){e=2633;break}if((c[d+(a<<2)>>2]|0)!=0){e=2631;break}}if((e|0)==2631){f=0;g=f;return g|0}else if((e|0)==2633){f=1;g=f;return g|0}return 0}function b3(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=bo(f,b,c,a)|0;d=d+(bn(f,f,a,e)|0)|0;return d|0}function b4(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=bX(f,b,c,a)|0;d=d+(bW(f,f,a,e)|0)|0;return d|0}function b5(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;h=a;a=b;b=d;d=e;e=g;g=((b+2|0)>>>0)/3|0;i=b-(g<<1)|0;b=f-(g<<1)|0;f=e+(g<<2<<2)+16|0;j=e+(g<<1<<2)+8|0;k=h+(g<<2)+4|0;l=h;m=e+((g*3|0)<<2)+12|0;n=h+(g<<1<<2)+8|0;o=e;p=0;q=a5(o,a,g,a+(g<<1<<2)|0,i)|0;c[f+(g<<2)>>2]=q+(bo(f,o,a+(g<<2)|0,g)|0);do{if((q|0)==0){if((be(o,a+(g<<2)|0,g)|0)>=0){r=2648;break}s=j;t=a+(g<<2)|0;u=o;v=g;bX(s,t,u,v)|0;c[j+(g<<2)>>2]=0;p=1}else{r=2648}}while(0);if((r|0)==2648){q=q-(bX(j,o,a+(g<<2)|0,g)|0)|0;c[j+(g<<2)>>2]=q}q=bo(k,a+(g<<1<<2)|0,f,i)|0;if((i|0)!=(g|0)){q=bn(k+(i<<2)|0,f+(i<<2)|0,g-i|0,q)|0}q=q+(c[f+(g<<2)>>2]|0)|0;q=(q<<1)+(bu(k,k,g,1)|0)|0;q=q-(bX(k,k,a,g)|0)|0;c[k+(g<<2)>>2]=q;q=a5(o,d,g,d+(g<<1<<2)|0,b)|0;c[l+(g<<2)>>2]=q+(bo(l,o,d+(g<<2)|0,g)|0);do{if((q|0)==0){if((be(o,d+(g<<2)|0,g)|0)>=0){r=2654;break}v=m;u=d+(g<<2)|0;t=o;s=g;bX(v,u,t,s)|0;c[m+(g<<2)>>2]=0;p=p^1}else{r=2654}}while(0);if((r|0)==2654){q=q-(bX(m,o,d+(g<<2)|0,g)|0)|0;c[m+(g<<2)>>2]=q}q=bo(n,l,d+(g<<1<<2)|0,b)|0;if((b|0)!=(g|0)){q=bn(n+(b<<2)|0,l+(b<<2)|0,g-b|0,q)|0}q=q+(c[l+(g<<2)>>2]|0)|0;q=(q<<1)+(bu(n,n,g,1)|0)|0;q=q-(bX(n,n,d,g)|0)|0;c[n+(g<<2)>>2]=q;if((g+1|0)>=100){b5(e,j,g+1|0,m,g+1|0,e+((g*5|0)<<2)+20|0)}else{bZ(e,j,g+1|0,m,g+1|0,e+((g*5|0)<<2)+20|0)}if((g+1|0)>=100){b5(e+(g<<1<<2)+4|0,k,g+1|0,n,g+1|0,e+((g*5|0)<<2)+20|0)}else{bZ(e+(g<<1<<2)+4|0,k,g+1|0,n,g+1|0,e+((g*5|0)<<2)+20|0)}if((i|0)>(b|0)){n=h+(g<<2<<2)|0;k=a+(g<<1<<2)|0;m=i;j=d+(g<<1<<2)|0;o=b;cu(n,k,m,j,o)|0}else{if((i|0)>=100){b5(h+(g<<2<<2)|0,a+(g<<1<<2)|0,i,d+(g<<1<<2)|0,i,e+((g*5|0)<<2)+20|0)}else{bZ(h+(g<<2<<2)|0,a+(g<<1<<2)|0,i,d+(g<<1<<2)|0,i,e+((g*5|0)<<2)+20|0)}}o=c[h+(g<<2<<2)>>2]|0;q=c[h+(g<<2<<2)+4>>2]|0;if((g+1|0)>=100){b5(h+(g<<1<<2)|0,f,g+1|0,l,g+1|0,e+((g*5|0)<<2)+20|0)}else{bZ(h+(g<<1<<2)|0,f,g+1|0,l,g+1|0,e+((g*5|0)<<2)+20|0)}c[h+(g<<2<<2)+4>>2]=q;if((g|0)>=100){b5(h,a,g,d,g,e+((g*5|0)<<2)+20|0)}else{bZ(h,a,g,d,g,e+((g*5|0)<<2)+20|0)}cp(h,e+(g<<1<<2)+4|0,e,g,i+b|0,p,o);return}function b6(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=a;a=b;b=d;d=e;e=((b+2|0)>>>0)/3|0;g=b-(e<<1)|0;b=d+(e<<2<<2)+16|0;h=d+(e<<1<<2)+8|0;i=f+(e<<2)+4|0;j=d;k=a5(j,a,e,a+(e<<1<<2)|0,g)|0;c[b+(e<<2)>>2]=k+(bo(b,j,a+(e<<2)|0,e)|0);do{if((k|0)==0){if((be(j,a+(e<<2)|0,e)|0)>=0){l=2703;break}m=h;n=a+(e<<2)|0;o=j;p=e;bX(m,n,o,p)|0;c[h+(e<<2)>>2]=0}else{l=2703}}while(0);if((l|0)==2703){k=k-(bX(h,j,a+(e<<2)|0,e)|0)|0;c[h+(e<<2)>>2]=k}k=bo(i,a+(e<<1<<2)|0,b,g)|0;if((g|0)!=(e|0)){k=bn(i+(g<<2)|0,b+(g<<2)|0,e-g|0,k)|0}k=k+(c[b+(e<<2)>>2]|0)|0;k=(k<<1)+(bu(i,i,e,1)|0)|0;k=k-(bX(i,i,a,e)|0)|0;c[i+(e<<2)>>2]=k;if((e+1|0)>=50){if((e+1|0)>=120){b6(d,h,e+1|0,d+((e*5|0)<<2)+20|0)}else{b$(d,h,e+1|0,d+((e*5|0)<<2)+20|0)}}else{bQ(d,h,e+1|0)}if((e+1|0)>=50){if((e+1|0)>=120){b6(d+(e<<1<<2)+4|0,i,e+1|0,d+((e*5|0)<<2)+20|0)}else{b$(d+(e<<1<<2)+4|0,i,e+1|0,d+((e*5|0)<<2)+20|0)}}else{bQ(d+(e<<1<<2)+4|0,i,e+1|0)}if((g|0)>=50){if((g|0)>=120){b6(f+(e<<2<<2)|0,a+(e<<1<<2)|0,g,d+((e*5|0)<<2)+20|0)}else{b$(f+(e<<2<<2)|0,a+(e<<1<<2)|0,g,d+((e*5|0)<<2)+20|0)}}else{bQ(f+(e<<2<<2)|0,a+(e<<1<<2)|0,g)}i=c[f+(e<<2<<2)>>2]|0;k=c[f+(e<<2<<2)+4>>2]|0;if((e+1|0)>=50){if((e+1|0)>=120){b6(f+(e<<1<<2)|0,b,e+1|0,d+((e*5|0)<<2)+20|0)}else{b$(f+(e<<1<<2)|0,b,e+1|0,d+((e*5|0)<<2)+20|0)}}else{bQ(f+(e<<1<<2)|0,b,e+1|0)}c[f+(e<<2<<2)+4>>2]=k;if((e|0)>=50){if((e|0)>=120){b6(f,a,e,d+((e*5|0)<<2)+20|0)}else{b$(f,a,e,d+((e*5|0)<<2)+20|0)}}else{bQ(f,a,e)}cp(f,d+(e<<1<<2)+4|0,d,e,g+g|0,0,i);return}function b7(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;h=a;a=b;b=d;d=e;e=g;g=b+3>>2;i=b-(g*3|0)|0;b=f-(g*3|0)|0;f=1&(cf(h,h+(g<<2)+4|0,a,g,i,e+(g<<3<<2)+20|0)|0);f=f^1&(cf(h+(g<<2<<2)+8|0,h+(g<<1<<2)+8|0,d,g,b,e+(g<<3<<2)+20|0)|0);if((g+1|0)>=100){b5(e,h,g+1|0,h+(g<<2<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}else{bZ(e,h,g+1|0,h+(g<<2<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}if((g+1|0)>=100){b5(e+(g<<1<<2)+4|0,h+(g<<2)+4|0,g+1|0,h+(g<<1<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}else{bZ(e+(g<<1<<2)+4|0,h+(g<<2)+4|0,g+1|0,h+(g<<1<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}j=bu(h,a,g,1)|0;j=j+(bo(h,h,a+(g<<2)|0,g)|0)|0;j=(j<<1)+(bu(h,h,g,1)|0)|0;j=j+(bo(h,h,a+(g<<1<<2)|0,g)|0)|0;j=(j<<1)+(bu(h,h,g,1)|0)|0;c[h+(g<<2)>>2]=j+(a5(h,h,g,a+((g*3|0)<<2)|0,i)|0);j=bu(h+(g<<2<<2)+8|0,d,g,1)|0;j=j+(bo(h+(g<<2<<2)+8|0,h+(g<<2<<2)+8|0,d+(g<<2)|0,g)|0)|0;j=(j<<1)+(bu(h+(g<<2<<2)+8|0,h+(g<<2<<2)+8|0,g,1)|0)|0;j=j+(bo(h+(g<<2<<2)+8|0,h+(g<<2<<2)+8|0,d+(g<<1<<2)|0,g)|0)|0;j=(j<<1)+(bu(h+(g<<2<<2)+8|0,h+(g<<2<<2)+8|0,g,1)|0)|0;c[h+(g<<2<<2)+8+(g<<2)>>2]=j+(a5(h+(g<<2<<2)+8|0,h+(g<<2<<2)+8|0,g,d+((g*3|0)<<2)|0,b)|0);if((g+1|0)>=100){b5(e+(g<<2<<2)+8|0,h,g+1|0,h+(g<<2<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}else{bZ(e+(g<<2<<2)+8|0,h,g+1|0,h+(g<<2<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}f=f|2&(ce(h,h+(g<<2)+4|0,a,g,i,e+(g<<3<<2)+20|0)|0);f=f^2&(ce(h+(g<<2<<2)+8|0,h+(g<<1<<2)+8|0,d,g,b,e+(g<<3<<2)+20|0)|0);if((g+1|0)>=100){b5(e+((g*6|0)<<2)+12|0,h+(g<<2)+4|0,g+1|0,h+(g<<1<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}else{bZ(e+((g*6|0)<<2)+12|0,h+(g<<2)+4|0,g+1|0,h+(g<<1<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}if((g+1|0)>=100){b5(h+(g<<1<<2)|0,h,g+1|0,h+(g<<2<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}else{bZ(h+(g<<1<<2)|0,h,g+1|0,h+(g<<2<<2)+8|0,g+1|0,e+(g<<3<<2)+20|0)}if((g|0)>=100){b5(h,a,g,d,g,e+(g<<3<<2)+20|0)}else{bZ(h,a,g,d,g,e+(g<<3<<2)+20|0)}if((i|0)>(b|0)){j=h+((g*6|0)<<2)|0;k=a+((g*3|0)<<2)|0;l=i;m=d+((g*3|0)<<2)|0;n=b;cu(j,k,l,m,n)|0;o=h;p=g;q=f;r=e;s=g;t=s<<1;u=r+(t<<2)|0;v=u+4|0;w=e;x=g;y=x*6|0;z=w+(y<<2)|0;A=z+12|0;B=e;C=e;D=g;E=D<<2;F=C+(E<<2)|0;G=F+8|0;H=i;I=b;J=H+I|0;K=e;L=g;M=L<<3;N=K+(M<<2)|0;O=N+20|0;cq(o,p,q,v,A,B,G,J,O);return}if((i|0)>=100){b5(h+((g*6|0)<<2)|0,a+((g*3|0)<<2)|0,i,d+((g*3|0)<<2)|0,i,e+(g<<3<<2)+20|0)}else{bZ(h+((g*6|0)<<2)|0,a+((g*3|0)<<2)|0,i,d+((g*3|0)<<2)|0,i,e+(g<<3<<2)+20|0)}o=h;p=g;q=f;r=e;s=g;t=s<<1;u=r+(t<<2)|0;v=u+4|0;w=e;x=g;y=x*6|0;z=w+(y<<2)|0;A=z+12|0;B=e;C=e;D=g;E=D<<2;F=C+(E<<2)|0;G=F+8|0;H=i;I=b;J=H+I|0;K=e;L=g;M=L<<3;N=K+(M<<2)|0;O=N+20|0;cq(o,p,q,v,A,B,G,J,O);return}function b8(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=a;a=b;b=d;d=e;e=b+3>>2;g=b-(e*3|0)|0;cf(f,f+(e<<2<<2)+8|0,a,e,g,d+(e<<3<<2)+20|0)|0;if((e+1|0)>=120){b6(d,f,e+1|0,d+(e<<3<<2)+20|0)}else{b$(d,f,e+1|0,d+(e<<3<<2)+20|0)}if((e+1|0)>=120){b6(d+(e<<1<<2)+4|0,f+(e<<2<<2)+8|0,e+1|0,d+(e<<3<<2)+20|0)}else{b$(d+(e<<1<<2)+4|0,f+(e<<2<<2)+8|0,e+1|0,d+(e<<3<<2)+20|0)}b=bu(f,a,e,1)|0;b=b+(bo(f,f,a+(e<<2)|0,e)|0)|0;b=(b<<1)+(bu(f,f,e,1)|0)|0;b=b+(bo(f,f,a+(e<<1<<2)|0,e)|0)|0;b=(b<<1)+(bu(f,f,e,1)|0)|0;c[f+(e<<2)>>2]=b+(a5(f,f,e,a+((e*3|0)<<2)|0,g)|0);if((e+1|0)>=120){b6(d+(e<<2<<2)+8|0,f,e+1|0,d+(e<<3<<2)+20|0)}else{b$(d+(e<<2<<2)+8|0,f,e+1|0,d+(e<<3<<2)+20|0)}ce(f,f+(e<<2<<2)+8|0,a,e,g,d+(e<<3<<2)+20|0)|0;if((e+1|0)>=120){b6(f+(e<<1<<2)|0,f,e+1|0,d+(e<<3<<2)+20|0)}else{b$(f+(e<<1<<2)|0,f,e+1|0,d+(e<<3<<2)+20|0)}if((e+1|0)>=120){b6(d+((e*6|0)<<2)+12|0,f+(e<<2<<2)+8|0,e+1|0,d+(e<<3<<2)+20|0)}else{b$(d+((e*6|0)<<2)+12|0,f+(e<<2<<2)+8|0,e+1|0,d+(e<<3<<2)+20|0)}if((e|0)>=120){b6(f,a,e,d+(e<<3<<2)+20|0)}else{b$(f,a,e,d+(e<<3<<2)+20|0)}if((g|0)>=120){b6(f+((e*6|0)<<2)|0,a+((e*3|0)<<2)|0,g,d+(e<<3<<2)+20|0)}else{b$(f+((e*6|0)<<2)|0,a+((e*3|0)<<2)|0,g,d+(e<<3<<2)+20|0)}cq(f,e,0,d+(e<<1<<2)+4|0,d+((e*6|0)<<2)+12|0,d,d+(e<<2<<2)+8|0,g<<1,d+(e<<3<<2)+20|0);return}function b9(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=b;b=c;c=d;d=(((b-1|0)>>>0)/6|0)+1|0;f=b-(d*5|0)|0;cj(e+((d*9|0)<<2)+8|0,e+((d*7|0)<<2)|0,5,a,d,f,1,e)|0;b$(e,e+((d*7|0)<<2)|0,d+1|0,c+((d*9|0)<<2)+12|0);b$(c,e+((d*9|0)<<2)+8|0,d+1|0,c+((d*9|0)<<2)+12|0);cd(c,(d<<1)+1|0,e,0,d,1,0);cg(e+((d*9|0)<<2)+8|0,e+((d*7|0)<<2)|0,5,a,d,f,e)|0;b$(e,e+((d*7|0)<<2)|0,d+1|0,c+((d*9|0)<<2)+12|0);b$(c+((d*3|0)<<2)+4|0,e+((d*9|0)<<2)+8|0,d+1|0,c+((d*9|0)<<2)+12|0);cd(c+((d*3|0)<<2)+4|0,(d<<1)+1|0,e,0,d,0,0);ci(e+((d*9|0)<<2)+8|0,e+((d*7|0)<<2)|0,5,a,d,f,2,e)|0;b$(e,e+((d*7|0)<<2)|0,d+1|0,c+((d*9|0)<<2)+12|0);b$(c+((d*6|0)<<2)+8|0,e+((d*9|0)<<2)+8|0,d+1|0,c+((d*9|0)<<2)+12|0);cd(c+((d*6|0)<<2)+8|0,(d<<1)+1|0,e,0,d,2,4);cj(e+((d*9|0)<<2)+8|0,e+((d*7|0)<<2)|0,5,a,d,f,2,e)|0;b$(e,e+((d*7|0)<<2)|0,d+1|0,c+((d*9|0)<<2)+12|0);b$(e+((d*3|0)<<2)|0,e+((d*9|0)<<2)+8|0,d+1|0,c+((d*9|0)<<2)+12|0);cd(e+((d*3|0)<<2)|0,(d<<1)+1|0,e,0,d,2,0);ch(e+((d*9|0)<<2)+8|0,e+((d*7|0)<<2)|0,5,a,d,f,e)|0;b$(e,e+((d*7|0)<<2)|0,d+1|0,c+((d*9|0)<<2)+12|0);b$(e+((d*7|0)<<2)|0,e+((d*9|0)<<2)+8|0,d+1|0,c+((d*9|0)<<2)+12|0);cd(e+((d*7|0)<<2)|0,(d<<1)+1|0,e,0,d,1,2);b$(e,a,d,c+((d*9|0)<<2)+12|0);cl(e,c+((d*6|0)<<2)+8|0,c+((d*3|0)<<2)+4|0,c,d,f<<1,0,c+((d*9|0)<<2)+12|0);return}function ca(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;g=a;a=b;b=c;c=d;d=e;e=f;if((((b*17|0|0)<(d*18|0|0)|0)!=0|0)!=0){h=(((b-1|0)>>>0)/6|0)+1|0;i=5;j=5;k=0;l=b-(h*5|0)|0;m=d-(h*5|0)|0}else{if(((b*5|0)*18|0|0)<(d*119|0|0)){j=7;i=6}else{if(((b*5|0)*17|0|0)<(d*126|0|0)){j=7;i=5}else{if((b*18|0|0)<(d*34|0|0)){j=8;i=5}else{if((b*17|0|0)<(d*36|0|0)){j=8;i=4}else{j=9;i=4}}}}k=(j^i)&1;f=_(i,b)|0;if((f|0)>=(_(j,d)|0)){n=((b-1|0)>>>0)/(j>>>0)|0}else{n=((d-1|0)>>>0)/(i>>>0)|0}h=n+1|0;j=j-1|0;i=i-1|0;l=b-(_(j,h)|0)|0;m=d-(_(i,h)|0)|0;if((k|0)!=0){if((((l|0)<1|0)!=0|0)!=0){j=j-1|0;l=l+h|0;k=0}else{if((((m|0)<1|0)!=0|0)!=0){i=i-1|0;m=m+h|0;k=0}}}}d=cj(g+((h*9|0)<<2)+8|0,g+((h*7|0)<<2)|0,j,a,h,l,1,g)|0;b=d^(cj(e+((h*9|0)<<2)+12|0,g+(h<<3<<2)+4|0,i,c,h,m,1,g)|0);if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){ca(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);ca(e,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}else{b7(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b7(e,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{b5(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b5(e,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{bZ(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);bZ(e,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}cd(e,(h<<1)+1|0,g,b,h,k+1|0,k);b=cg(g+((h*9|0)<<2)+8|0,g+((h*7|0)<<2)|0,j,a,h,l,g)|0;if((((i|0)==3|0)!=0|0)!=0){b=b^(ce(e+((h*9|0)<<2)+12|0,g+(h<<3<<2)+4|0,c,h,m,g)|0)}else{b=b^(cg(e+((h*9|0)<<2)+12|0,g+(h<<3<<2)+4|0,i,c,h,m,g)|0)}if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){ca(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);ca(e+((h*3|0)<<2)+4|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}else{b7(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b7(e+((h*3|0)<<2)+4|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{b5(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b5(e+((h*3|0)<<2)+4|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{bZ(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);bZ(e+((h*3|0)<<2)+4|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}cd(e+((h*3|0)<<2)+4|0,(h<<1)+1|0,g,b,h,0,0);d=ci(g+((h*9|0)<<2)+8|0,g+((h*7|0)<<2)|0,j,a,h,l,2,g)|0;b=d^(ci(e+((h*9|0)<<2)+12|0,g+(h<<3<<2)+4|0,i,c,h,m,2,g)|0);if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){ca(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);ca(e+((h*6|0)<<2)+8|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}else{b7(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b7(e+((h*6|0)<<2)+8|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{b5(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b5(e+((h*6|0)<<2)+8|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{bZ(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);bZ(e+((h*6|0)<<2)+8|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}cd(e+((h*6|0)<<2)+8|0,(h<<1)+1|0,g,b,h,2,4);d=cj(g+((h*9|0)<<2)+8|0,g+((h*7|0)<<2)|0,j,a,h,l,2,g)|0;b=d^(cj(e+((h*9|0)<<2)+12|0,g+(h<<3<<2)+4|0,i,c,h,m,2,g)|0);if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){ca(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);ca(g+((h*3|0)<<2)|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}else{b7(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b7(g+((h*3|0)<<2)|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{b5(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b5(g+((h*3|0)<<2)|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{bZ(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);bZ(g+((h*3|0)<<2)|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}cd(g+((h*3|0)<<2)|0,(h<<1)+1|0,g,b,h,k+1<<1,k<<1);d=ch(g+((h*9|0)<<2)+8|0,g+((h*7|0)<<2)|0,j,a,h,l,g)|0;b=d^(ch(e+((h*9|0)<<2)+12|0,g+(h<<3<<2)+4|0,i,c,h,m,g)|0);if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){ca(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);ca(g+((h*7|0)<<2)|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}else{b7(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b7(g+((h*7|0)<<2)|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{b5(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);b5(g+((h*7|0)<<2)|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}}else{bZ(g,g+((h*7|0)<<2)|0,h+1|0,g+(h<<3<<2)+4|0,h+1|0,e+((h*10|0)<<2)+16|0);bZ(g+((h*7|0)<<2)|0,g+((h*9|0)<<2)+8|0,h+1|0,e+((h*9|0)<<2)+12|0,h+1|0,e+((h*10|0)<<2)+16|0)}cd(g+((h*7|0)<<2)|0,(h<<1)+1|0,g,b,h,1,2);if((h|0)>=100){if((h|0)>=300){if((h|0)>=350){ca(g,a,h,c,h,e+((h*9|0)<<2)+12|0)}else{b7(g,a,h,c,h,e+((h*9|0)<<2)+12|0)}}else{b5(g,a,h,c,h,e+((h*9|0)<<2)+12|0)}}else{bZ(g,a,h,c,h,e+((h*9|0)<<2)+12|0)}if((((k|0)!=0|0)!=0|0)==0){o=g;p=e;q=h;r=q*6|0;s=p+(r<<2)|0;t=s+8|0;u=e;v=h;w=v*3|0;x=u+(w<<2)|0;y=x+4|0;z=e;A=h;B=l;C=m;D=B+C|0;E=k;F=e;G=h;H=G*9|0;I=F+(H<<2)|0;J=I+12|0;cl(o,t,y,z,A,D,E,J);return}if((l|0)>(m|0)){b=g+((h*11|0)<<2)|0;d=a+((_(j,h)|0)<<2)|0;n=l;f=c+((_(i,h)|0)<<2)|0;K=m;cu(b,d,n,f,K)|0}else{K=g+((h*11|0)<<2)|0;f=c+((_(i,h)|0)<<2)|0;i=m;c=a+((_(j,h)|0)<<2)|0;j=l;cu(K,f,i,c,j)|0}o=g;p=e;q=h;r=q*6|0;s=p+(r<<2)|0;t=s+8|0;u=e;v=h;w=v*3|0;x=u+(w<<2)|0;y=x+4|0;z=e;A=h;B=l;C=m;D=B+C|0;E=k;F=e;G=h;H=G*9|0;I=F+(H<<2)|0;J=I+12|0;cl(o,t,y,z,A,D,E,J);return}function cb(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=b;b=c;c=d;d=(b-1>>3)+1|0;f=b-(d*7|0)|0;cj(e+((d*13|0)<<2)+8|0,e+((d*11|0)<<2)|0,7,a,d,f,3,e)|0;if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){cb(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);cb(c,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}else{b9(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b9(c,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b8(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b8(c,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b6(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b6(c,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b$(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b$(c,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}cd(c,(d<<1)+2|0,e,0,d,3,0);cj(e+((d*13|0)<<2)+8|0,e+((d*11|0)<<2)|0,7,a,d,f,2,e)|0;if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){cb(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);cb(c+((d*3|0)<<2)+4|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}else{b9(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b9(c+((d*3|0)<<2)+4|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b8(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b8(c+((d*3|0)<<2)+4|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b6(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b6(c+((d*3|0)<<2)+4|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b$(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b$(c+((d*3|0)<<2)+4|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}cd(c+((d*3|0)<<2)+4|0,(d<<1)+1|0,e,0,d,2,0);ch(e+((d*13|0)<<2)+8|0,e+((d*11|0)<<2)|0,7,a,d,f,e)|0;if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){cb(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);cb(c+((d*6|0)<<2)+8|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}else{b9(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b9(c+((d*6|0)<<2)+8|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b8(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b8(c+((d*6|0)<<2)+8|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b6(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b6(c+((d*6|0)<<2)+8|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b$(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b$(c+((d*6|0)<<2)+8|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}cd(c+((d*6|0)<<2)+8|0,(d<<1)+1|0,e,0,d,1,2);ci(e+((d*13|0)<<2)+8|0,e+((d*11|0)<<2)|0,7,a,d,f,3,e)|0;if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){cb(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);cb(c+((d*9|0)<<2)+12|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}else{b9(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b9(c+((d*9|0)<<2)+12|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b8(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b8(c+((d*9|0)<<2)+12|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b6(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b6(c+((d*9|0)<<2)+12|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b$(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b$(c+((d*9|0)<<2)+12|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}cd(c+((d*9|0)<<2)+12|0,(d<<1)+2|0,e,0,d,3,6);cj(e+((d*13|0)<<2)+8|0,e+((d*11|0)<<2)|0,7,a,d,f,1,e)|0;if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){cb(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);cb(e+((d*3|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}else{b9(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b9(e+((d*3|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b8(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b8(e+((d*3|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b6(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b6(e+((d*3|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b$(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b$(e+((d*3|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}cd(e+((d*3|0)<<2)|0,(d<<1)+1|0,e,0,d,1,0);cg(e+((d*13|0)<<2)+8|0,e+((d*11|0)<<2)|0,7,a,d,f,e)|0;if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){cb(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);cb(e+((d*7|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}else{b9(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b9(e+((d*7|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b8(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b8(e+((d*7|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b6(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b6(e+((d*7|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b$(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b$(e+((d*7|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}cd(e+((d*7|0)<<2)|0,(d<<1)+1|0,e,0,d,0,0);ci(e+((d*13|0)<<2)+8|0,e+((d*11|0)<<2)|0,7,a,d,f,2,e)|0;if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){cb(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);cb(e+((d*11|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}else{b9(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b9(e+((d*11|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b8(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b8(e+((d*11|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b6(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b6(e+((d*11|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}}else{b$(e,e+((d*11|0)<<2)|0,d+1|0,c+((d*12|0)<<2)+16|0);b$(e+((d*11|0)<<2)|0,e+((d*13|0)<<2)+8|0,d+1|0,c+((d*12|0)<<2)+16|0)}cd(e+((d*11|0)<<2)|0,(d<<1)+1|0,e,0,d,2,4);if((d|0)>=120){if((d|0)>=400){if((d|0)>=350){if((d|0)>=450){cb(e,a,d,c+((d*12|0)<<2)+16|0)}else{b9(e,a,d,c+((d*12|0)<<2)+16|0)}}else{b8(e,a,d,c+((d*12|0)<<2)+16|0)}}else{b6(e,a,d,c+((d*12|0)<<2)+16|0)}}else{b$(e,a,d,c+((d*12|0)<<2)+16|0)}cn(e,c+((d*9|0)<<2)+12|0,c+((d*6|0)<<2)+8|0,c+((d*3|0)<<2)+4|0,c,d,f<<1,0,c+((d*12|0)<<2)+16|0);return}function cc(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;g=a;a=b;b=c;c=d;d=e;e=f;do{if((((b|0)==(d|0)|0)!=0|0)!=0){h=3128}else{if((b*10|0|0)<((d>>1)*21|0|0)){h=3128;break}if((b*13|0|0)<(d<<4|0)){i=9;j=8}else{if((b*10|0|0)<((d>>1)*27|0|0)){i=9;j=7}else{if((b*10|0|0)<((d>>1)*33|0|0)){i=10;j=7}else{if((b<<2|0)<(d*7|0|0)){i=10;j=6}else{if((b*6|0|0)<(d*13|0|0)){i=11;j=6}else{i=11;j=5}}}}}k=i+j&1;f=_(j,b)|0;if((f|0)>=(_(i,d)|0)){l=((b-1|0)>>>0)/(i>>>0)|0}else{l=((d-1|0)>>>0)/(j>>>0)|0}m=l+1|0;i=i-1|0;j=j-1|0;n=b-(_(i,m)|0)|0;o=d-(_(j,m)|0)|0;if((k|0)!=0){if((((n|0)<1|0)!=0|0)!=0){i=i-1|0;n=n+m|0;k=0}else{if((((o|0)<1|0)!=0|0)!=0){j=j-1|0;o=o+m|0;k=0}}}}}while(0);if((h|0)==3128){k=0;m=(b-1>>3)+1|0;j=7;i=7;n=b-(m*7|0)|0;o=d-(m*7|0)|0}d=cj(g+((m*13|0)<<2)+8|0,g+((m*11|0)<<2)|0,i,a,m,n,3,g)|0;b=d^(cj(e+((m*12|0)<<2)+16|0,g+((m*12|0)<<2)+4|0,j,c,m,o,3,g)|0);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){ca(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);ca(e,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}else{b7(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b7(e,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{b5(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b5(e,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{bZ(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);bZ(e,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}cd(e,(m<<1)+2|0,g,b,m,(k+1|0)*3|0,k*3|0);d=cj(g+((m*13|0)<<2)+8|0,g+((m*11|0)<<2)|0,i,a,m,n,2,g)|0;b=d^(cj(e+((m*12|0)<<2)+16|0,g+((m*12|0)<<2)+4|0,j,c,m,o,2,g)|0);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){ca(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);ca(e+((m*3|0)<<2)+4|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}else{b7(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b7(e+((m*3|0)<<2)+4|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{b5(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b5(e+((m*3|0)<<2)+4|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{bZ(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);bZ(e+((m*3|0)<<2)+4|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}cd(e+((m*3|0)<<2)+4|0,(m<<1)+1|0,g,b,m,k+1<<1,k<<1);d=ch(g+((m*13|0)<<2)+8|0,g+((m*11|0)<<2)|0,i,a,m,n,g)|0;b=d^(ch(e+((m*12|0)<<2)+16|0,g+((m*12|0)<<2)+4|0,j,c,m,o,g)|0);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){ca(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);ca(e+((m*6|0)<<2)+8|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}else{b7(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b7(e+((m*6|0)<<2)+8|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{b5(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b5(e+((m*6|0)<<2)+8|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{bZ(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);bZ(e+((m*6|0)<<2)+8|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}cd(e+((m*6|0)<<2)+8|0,(m<<1)+1|0,g,b,m,1,2);d=ci(g+((m*13|0)<<2)+8|0,g+((m*11|0)<<2)|0,i,a,m,n,3,g)|0;b=d^(ci(e+((m*12|0)<<2)+16|0,g+((m*12|0)<<2)+4|0,j,c,m,o,3,g)|0);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){ca(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);ca(e+((m*9|0)<<2)+12|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}else{b7(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b7(e+((m*9|0)<<2)+12|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{b5(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b5(e+((m*9|0)<<2)+12|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{bZ(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);bZ(e+((m*9|0)<<2)+12|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}cd(e+((m*9|0)<<2)+12|0,(m<<1)+2|0,g,b,m,3,6);d=cj(g+((m*13|0)<<2)+8|0,g+((m*11|0)<<2)|0,i,a,m,n,1,g)|0;b=d^(cj(e+((m*12|0)<<2)+16|0,g+((m*12|0)<<2)+4|0,j,c,m,o,1,g)|0);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){ca(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);ca(g+((m*3|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}else{b7(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b7(g+((m*3|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{b5(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b5(g+((m*3|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{bZ(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);bZ(g+((m*3|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}cd(g+((m*3|0)<<2)|0,(m<<1)+1|0,g,b,m,k+1|0,k);b=cg(g+((m*13|0)<<2)+8|0,g+((m*11|0)<<2)|0,i,a,m,n,g)|0;b=b^(cg(e+((m*12|0)<<2)+16|0,g+((m*12|0)<<2)+4|0,j,c,m,o,g)|0);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){ca(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);ca(g+((m*7|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}else{b7(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b7(g+((m*7|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{b5(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b5(g+((m*7|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{bZ(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);bZ(g+((m*7|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}cd(g+((m*7|0)<<2)|0,(m<<1)+1|0,g,b,m,0,0);d=ci(g+((m*13|0)<<2)+8|0,g+((m*11|0)<<2)|0,i,a,m,n,2,g)|0;b=d^(ci(e+((m*12|0)<<2)+16|0,g+((m*12|0)<<2)+4|0,j,c,m,o,2,g)|0);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){ca(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);ca(g+((m*11|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}else{b7(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b7(g+((m*11|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{b5(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);b5(g+((m*11|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}}else{bZ(g,g+((m*11|0)<<2)|0,m+1|0,g+((m*12|0)<<2)+4|0,m+1|0,e+((m*13|0)<<2)+20|0);bZ(g+((m*11|0)<<2)|0,g+((m*13|0)<<2)+8|0,m+1|0,e+((m*12|0)<<2)+16|0,m+1|0,e+((m*13|0)<<2)+20|0)}cd(g+((m*11|0)<<2)|0,(m<<1)+1|0,g,b,m,2,4);if((m|0)>=100){if((m|0)>=300){if((m|0)>=350){ca(g,a,m,c,m,e+((m*12|0)<<2)+16|0)}else{b7(g,a,m,c,m,e+((m*12|0)<<2)+16|0)}}else{b5(g,a,m,c,m,e+((m*12|0)<<2)+16|0)}}else{bZ(g,a,m,c,m,e+((m*12|0)<<2)+16|0)}if((((k|0)!=0|0)!=0|0)==0){p=g;q=e;r=m;s=r*9|0;t=q+(s<<2)|0;u=t+12|0;v=e;w=m;x=w*6|0;y=v+(x<<2)|0;z=y+8|0;A=e;B=m;C=B*3|0;D=A+(C<<2)|0;E=D+4|0;F=e;G=m;H=n;I=o;J=H+I|0;K=k;L=e;M=m;N=M*12|0;O=L+(N<<2)|0;P=O+16|0;cn(p,u,z,E,F,G,J,K,P);return}if((n|0)>(o|0)){b=g+((m*15|0)<<2)|0;d=a+((_(i,m)|0)<<2)|0;h=n;l=c+((_(j,m)|0)<<2)|0;f=o;cu(b,d,h,l,f)|0}else{f=g+((m*15|0)<<2)|0;l=c+((_(j,m)|0)<<2)|0;j=o;c=a+((_(i,m)|0)<<2)|0;i=n;cu(f,l,j,c,i)|0}p=g;q=e;r=m;s=r*9|0;t=q+(s<<2)|0;u=t+12|0;v=e;w=m;x=w*6|0;y=v+(x<<2)|0;z=y+8|0;A=e;B=m;C=B*3|0;D=A+(C<<2)|0;E=D+4|0;F=e;G=m;H=n;I=o;J=H+I|0;K=k;L=e;M=m;N=M*12|0;O=L+(N<<2)|0;P=O+16|0;cn(p,u,z,E,F,G,J,K,P);return}function cd(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0;i=a;a=b;b=d;d=f;f=g;g=h;if((e|0)!=0){e=b;h=i;j=b;k=a;bX(e,h,j,k)|0;k=b;j=b;h=a;bN(k,j,h,1)|0}else{h=b;j=i;k=b;e=a;bo(h,j,k,e)|0;e=b;k=b;j=a;bN(e,k,j,1)|0}bX(i,i,b,a)|0;if((f|0)>0){j=i;k=i;e=a;h=f;bN(j,k,e,h)|0}if((g|0)>0){h=b;e=b;k=a;j=g;bN(h,e,k,j)|0}c[i+(a<<2)>>2]=bo(i+(d<<2)|0,i+(d<<2)|0,b,a-d|0)|0;bn(i+(a<<2)|0,b+(a<<2)+(-d<<2)|0,d,c[i+(a<<2)>>2]|0)|0;return}function ce(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a;a=b;b=d;d=e;e=g;c[h+(d<<2)>>2]=bo(h,b,b+(d<<1<<2)|0,d)|0;c[e+(d<<2)>>2]=a5(e,b+(d<<2)|0,d,b+((d*3|0)<<2)|0,f)|0;f=(be(h,e,d+1|0)|0)<0?-1:0;if((f|0)!=0){b=a;g=e;i=h;j=d+1|0;bX(b,g,i,j)|0}else{j=a;a=h;i=e;g=d+1|0;bX(j,a,i,g)|0}bo(h,h,e,d+1|0)|0;return f|0}function cf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a;a=b;b=d;d=e;e=f;f=g;g=bu(f,b+(d<<1<<2)|0,d,2)|0;c[h+(d<<2)>>2]=g+(bo(h,f,b,d)|0);c[f+(e<<2)>>2]=bu(f,b+((d*3|0)<<2)|0,e,2)|0;if((e|0)<(d|0)){c[f+(d<<2)>>2]=a5(f,b+(d<<2)|0,d,f,e+1|0)|0}else{e=bo(f,b+(d<<2)|0,f,d)|0;b=f+(d<<2)|0;c[b>>2]=(c[b>>2]|0)+e}bu(f,f,d+1|0,1)|0;e=(be(h,f,d+1|0)|0)<0?-1:0;if((e|0)!=0){b=a;g=f;i=h;j=d+1|0;bX(b,g,i,j)|0}else{j=a;a=h;i=f;g=d+1|0;bX(j,a,i,g)|0}bo(h,h,f,d+1|0)|0;return e|0}function cg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;c[i+(e<<2)>>2]=bo(i,d,d+(e<<1<<2)|0,e)|0;h=4;while(1){if(h>>>0>=b>>>0){break}a5(i,i,e+1|0,d+((_(h,e)|0)<<2)|0,e)|0;h=h+2|0}c[g+(e<<2)>>2]=bo(g,d+(e<<2)|0,d+((e*3|0)<<2)|0,e)|0;h=5;while(1){if(h>>>0>=b>>>0){break}a5(g,g,e+1|0,d+((_(h,e)|0)<<2)|0,e)|0;h=h+2|0}if((b&1|0)!=0){h=g;j=g;k=e+1|0;l=d+((_(b,e)|0)<<2)|0;m=f;a5(h,j,k,l,m)|0}else{m=i;l=i;k=e+1|0;j=d+((_(b,e)|0)<<2)|0;b=f;a5(m,l,k,j,b)|0}b=(be(i,g,e+1|0)|0)<0?-1:0;if((b|0)!=0){j=a;k=g;l=i;m=e+1|0;bX(j,k,l,m)|0}else{m=a;a=i;l=g;k=e+1|0;bX(m,a,l,k)|0}bo(i,i,g,e+1|0)|0;return b|0}function ch(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=0;h=h<<2;h=h+(bu(i,d+((_(b,e)|0)<<2)|0,f,2)|0)|0;h=h+(bo(i,i,d+((_(b-2|0,e)|0)<<2)|0,f)|0)|0;if((f|0)!=(e|0)){h=bn(i+(f<<2)|0,d+((_(b-2|0,e)|0)<<2)+(f<<2)|0,e-f|0,h)|0}f=b-4|0;while(1){if((f|0)<0){break}h=h<<2;h=h+(bu(i,i,e,2)|0)|0;h=h+(bo(i,i,d+((_(f,e)|0)<<2)|0,e)|0)|0;f=f-2|0}c[i+(e<<2)>>2]=h;b=b-1|0;h=0;h=h<<2;h=h+(bu(g,d+((_(b,e)|0)<<2)|0,e,2)|0)|0;h=h+(bo(g,g,d+((_(b-2|0,e)|0)<<2)|0,e)|0)|0;f=b-4|0;while(1){if((f|0)<0){break}h=h<<2;h=h+(bu(g,g,e,2)|0)|0;h=h+(bo(g,g,d+((_(f,e)|0)<<2)|0,e)|0)|0;f=f-2|0}c[g+(e<<2)>>2]=h;if((b&1|0)!=0){h=g;f=g;d=e+1|0;bu(h,f,d,1)|0}else{d=i;f=i;h=e+1|0;bu(d,f,h,1)|0}h=(be(i,g,e+1|0)|0)<0?-1:0;if((h|0)!=0){f=a;d=g;j=i;k=e+1|0;bX(f,d,j,k)|0}else{k=a;a=i;j=g;d=e+1|0;bX(k,a,j,d)|0}bo(i,i,g,e+1|0)|0;h=h^(b&1)-1;return h|0}function ci(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0;j=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;c[j+(e<<2)>>2]=bu(h,d+(e<<1<<2)|0,e,g<<1)|0;i=bo(j,d,h,e)|0;k=j+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+i;i=4;while(1){if(i>>>0>=b>>>0){break}k=d+((_(i,e)|0)<<2)|0;l=bu(h,k,e,_(i,g)|0)|0;k=j+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+l;l=bo(j,j,h,e)|0;k=j+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+l;i=i+2|0}c[h+(e<<2)>>2]=bu(h,d+(e<<2)|0,e,g)|0;i=3;while(1){if(i>>>0>=b>>>0){break}l=d+((_(i,e)|0)<<2)|0;k=bu(a,l,e,_(i,g)|0)|0;l=h+(e<<2)|0;c[l>>2]=(c[l>>2]|0)+k;k=bo(h,h,a,e)|0;l=h+(e<<2)|0;c[l>>2]=(c[l>>2]|0)+k;i=i+2|0}i=d+((_(b,e)|0)<<2)|0;c[a+(f<<2)>>2]=bu(a,i,f,_(b,g)|0)|0;if((b&1|0)!=0){b=h;g=h;i=e+1|0;d=a;k=f+1|0;a5(b,g,i,d,k)|0}else{k=j;d=j;i=e+1|0;g=a;b=f+1|0;a5(k,d,i,g,b)|0}b=(be(j,h,e+1|0)|0)<0?-1:0;if((b|0)!=0){g=a;i=h;d=j;k=e+1|0;bX(g,i,d,k)|0}else{k=a;a=j;d=h;i=e+1|0;bX(k,a,d,i)|0}bo(j,j,h,e+1|0)|0;return b|0}function cj(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;j=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;c[j+(e<<2)>>2]=bu(j,d,e,_(g,b)|0)|0;c[h+(e<<2)>>2]=bu(h,d+(e<<2)|0,e,_(g,b-1|0)|0)|0;if((b&1|0)!=0){i=h;k=h;l=e+1|0;m=d+((_(e,b)|0)<<2)|0;n=f;a5(i,k,l,m,n)|0;n=ck(j,d+((_(e,b-1|0)|0)<<2)|0,e,g,a)|0;m=j+(e<<2)|0;c[m>>2]=(c[m>>2]|0)+n}else{n=j;m=j;l=e+1|0;k=d+((_(e,b)|0)<<2)|0;i=f;a5(n,m,l,k,i)|0}i=2;while(1){if(i>>>0>=(b-1|0)>>>0){break}k=d+((_(e,i)|0)<<2)|0;l=ck(j,k,e,_(g,b-i|0)|0,a)|0;k=j+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+l;i=i+1|0;l=d+((_(e,i)|0)<<2)|0;k=ck(h,l,e,_(g,b-i|0)|0,a)|0;l=h+(e<<2)|0;c[l>>2]=(c[l>>2]|0)+k;i=i+1|0}i=(be(j,h,e+1|0)|0)<0?-1:0;if((i|0)!=0){b=a;g=h;d=j;k=e+1|0;bX(b,g,d,k)|0;o=j;p=j;q=h;r=e;s=r+1|0;t=bo(o,p,q,s)|0;u=i;return u|0}else{k=a;a=j;d=h;g=e+1|0;bX(k,a,d,g)|0;o=j;p=j;q=h;r=e;s=r+1|0;t=bo(o,p,q,s)|0;u=i;return u|0}return 0}function ck(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=c;c=e;e=bu(c,b,a,d)|0;return e+(bo(f,f,c,a)|0)|0}function cl(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0;j=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=e*3|0;k=i+1|0;if((g|0)!=0){l=bX(b,b,j+((e*11|0)<<2)|0,f)|0;m=b+(f<<2)|0;n=c[m>>2]|0;c[m>>2]=n-l;if(n>>>0<l>>>0){do{n=m+4|0;m=n;o=c[n>>2]|0;c[n>>2]=o-1;}while((o|0)==0)}l=cm(j+((e*7|0)<<2)|0,j+((e*11|0)<<2)|0,f,10,h)|0;m=j+((e*7|0)<<2)+(f<<2)|0;o=c[m>>2]|0;c[m>>2]=o-l;if(o>>>0<l>>>0){do{o=m+4|0;m=o;n=c[o>>2]|0;c[o>>2]=n-1;}while((n|0)==0)}m=d;n=c[m>>2]|0;c[m>>2]=n-((c[j+((e*11|0)<<2)>>2]|0)>>>2);if(n>>>0<(c[j+((e*11|0)<<2)>>2]|0)>>>2>>>0){do{n=m+4|0;m=n;o=c[n>>2]|0;c[n>>2]=o-1;}while((o|0)==0)}m=cm(d,j+((e*11|0)<<2)+4|0,f-1|0,30,h)|0;o=d+(f<<2)-4|0;n=c[o>>2]|0;c[o>>2]=n-m;if(n>>>0<m>>>0){do{m=o+4|0;o=m;n=c[m>>2]|0;c[m>>2]=n-1;}while((n|0)==0)}l=cm(a,j+((e*11|0)<<2)|0,f,20,h)|0;o=a+(f<<2)|0;n=c[o>>2]|0;c[o>>2]=n-l;if(n>>>0<l>>>0){do{n=o+4|0;o=n;m=c[n>>2]|0;c[n>>2]=m-1;}while((m|0)==0)}o=j+(i<<2)|0;m=c[o>>2]|0;c[o>>2]=m-((c[j+((e*11|0)<<2)>>2]|0)>>>4);if(m>>>0<(c[j+((e*11|0)<<2)>>2]|0)>>>4>>>0){do{m=o+4|0;o=m;n=c[m>>2]|0;c[m>>2]=n-1;}while((n|0)==0)}o=cm(j+(i<<2)|0,j+((e*11|0)<<2)+4|0,f-1|0,28,h)|0;n=j+(i<<2)+(f<<2)-4|0;m=c[n>>2]|0;c[n>>2]=m-o;if(m>>>0<o>>>0){do{o=n+4|0;n=o;m=c[o>>2]|0;c[o>>2]=m-1;}while((m|0)==0)}}n=cm(j+(i<<2)+(e<<2)|0,j,e<<1,20,h)|0;m=j+(i<<2)+(i<<2)|0;c[m>>2]=(c[m>>2]|0)-n;n=a+(e<<2)|0;m=c[n>>2]|0;c[n>>2]=m-((c[j>>2]|0)>>>4);if(m>>>0<(c[j>>2]|0)>>>4>>>0){do{m=n+4|0;n=m;o=c[m>>2]|0;c[m>>2]=o-1;}while((o|0)==0)}n=cm(a+(e<<2)|0,j+4|0,(e<<1)-1|0,28,h)|0;o=a+(e<<2)+(e<<1<<2)-4|0;m=c[o>>2]|0;c[o>>2]=m-n;if(m>>>0<n>>>0){do{n=o+4|0;o=n;m=c[n>>2]|0;c[n>>2]=m-1;}while((m|0)==0)}bo(h,a,j+(i<<2)|0,k)|0;bX(j+(i<<2)|0,j+(i<<2)|0,a,k)|0;o=a;a=h;h=o;o=cm(d+(e<<2)|0,j,e<<1,10,h)|0;m=d+(i<<2)|0;c[m>>2]=(c[m>>2]|0)-o;o=j+((e*7|0)<<2)+(e<<2)|0;m=c[o>>2]|0;c[o>>2]=m-((c[j>>2]|0)>>>2);if(m>>>0<(c[j>>2]|0)>>>2>>>0){do{m=o+4|0;o=m;n=c[m>>2]|0;c[m>>2]=n-1;}while((n|0)==0)}o=cm(j+((e*7|0)<<2)+(e<<2)|0,j+4|0,(e<<1)-1|0,30,h)|0;n=j+((e*7|0)<<2)+(e<<2)+(e<<1<<2)-4|0;m=c[n>>2]|0;c[n>>2]=m-o;if(m>>>0<o>>>0){do{o=n+4|0;n=o;m=c[o>>2]|0;c[o>>2]=m-1;}while((m|0)==0)}bX(h,d,j+((e*7|0)<<2)|0,k)|0;bo(j+((e*7|0)<<2)|0,j+((e*7|0)<<2)|0,d,k)|0;n=d;d=h;h=n;n=bX(b+(e<<2)|0,b+(e<<2)|0,j,e<<1)|0;m=b+(i<<2)|0;c[m>>2]=(c[m>>2]|0)-n;bY(j+(i<<2)|0,d,k,257)|0;br(j+(i<<2)|0,j+(i<<2)|0,k,11340);if((c[j+(i<<2)+(i<<2)>>2]&-536870912|0)!=0){n=j+(i<<2)+(i<<2)|0;c[n>>2]=c[n>>2]|-1073741824}cx(d,j+(i<<2)|0,k,60)|0;cy(d,d,k,16843009,0)|0;cm(j+((e*7|0)<<2)|0,b,k,5,h)|0;bY(a,j+((e*7|0)<<2)|0,k,100)|0;cm(a,b,k,9,h)|0;br(a,a,k,42525);bY(j+((e*7|0)<<2)|0,a,k,225)|0;br(j+((e*7|0)<<2)|0,j+((e*7|0)<<2)|0,k,36);bX(b,b,j+((e*7|0)<<2)|0,k)|0;bX(j+(i<<2)|0,j+((e*7|0)<<2)|0,j+(i<<2)|0,k)|0;bN(j+(i<<2)|0,j+(i<<2)|0,k,1)|0;bX(j+((e*7|0)<<2)|0,j+((e*7|0)<<2)|0,j+(i<<2)|0,k)|0;bo(d,d,a,k)|0;bN(d,d,k,1)|0;bX(b,b,a,k)|0;bX(a,a,d,k)|0;l=bo(j+(e<<2)|0,j+(e<<2)|0,d,e)|0;l=bn(j+(e<<1<<2)|0,d+(e<<2)|0,e,l)|0;k=d+(e<<1<<2)|0;h=(c[k>>2]|0)+l|0;c[k>>2]=h;if(h>>>0<l>>>0){do{h=k+4|0;k=h;n=(c[h>>2]|0)+1|0;c[h>>2]=n;}while((n|0)==0)}k=c[d+(i<<2)>>2]|0;l=k+(bo(j+(i<<2)|0,j+(i<<2)|0,d+(e<<1<<2)|0,e)|0)|0;d=j+(i<<2)+(e<<2)|0;k=(c[d>>2]|0)+l|0;c[d>>2]=k;if(k>>>0<l>>>0){do{k=d+4|0;d=k;n=(c[k>>2]|0)+1|0;c[k>>2]=n;}while((n|0)==0)}d=bo(j+((e*5|0)<<2)|0,j+((e*5|0)<<2)|0,b,e)|0;n=j+(i<<1<<2)|0;c[n>>2]=(c[n>>2]|0)+d;l=bn(j+(i<<1<<2)|0,b+(e<<2)|0,e,c[j+(i<<1<<2)>>2]|0)|0;d=b+(e<<1<<2)|0;n=(c[d>>2]|0)+l|0;c[d>>2]=n;if(n>>>0<l>>>0){do{n=d+4|0;d=n;k=(c[n>>2]|0)+1|0;c[n>>2]=k;}while((k|0)==0)}d=c[b+(i<<2)>>2]|0;l=d+(bo(j+((e*7|0)<<2)|0,j+((e*7|0)<<2)|0,b+(e<<1<<2)|0,e)|0)|0;b=j+(e<<3<<2)|0;d=(c[b>>2]|0)+l|0;c[b>>2]=d;if(d>>>0<l>>>0){do{d=b+4|0;b=d;k=(c[d>>2]|0)+1|0;c[d>>2]=k;}while((k|0)==0)}b=bo(j+((e*9|0)<<2)|0,j+((e*9|0)<<2)|0,a,e)|0;k=j+((e*10|0)<<2)|0;c[k>>2]=(c[k>>2]|0)+b;if((g|0)==0){g=j+((e*10|0)<<2)|0;b=a+(e<<2)|0;k=f;d=c[j+((e*10|0)<<2)>>2]|0;bn(g,b,k,d)|0;return}l=bn(j+((e*10|0)<<2)|0,a+(e<<2)|0,e,c[j+((e*10|0)<<2)>>2]|0)|0;d=a+(e<<1<<2)|0;k=(c[d>>2]|0)+l|0;c[d>>2]=k;if(k>>>0<l>>>0){do{k=d+4|0;d=k;b=(c[k>>2]|0)+1|0;c[k>>2]=b;}while((b|0)==0)}if((((f|0)>(e|0)|0)!=0|0)!=0){d=c[a+(i<<2)>>2]|0;l=d+(bo(j+((e*11|0)<<2)|0,j+((e*11|0)<<2)|0,a+(e<<1<<2)|0,e)|0)|0;d=j+(i<<2<<2)|0;i=(c[d>>2]|0)+l|0;c[d>>2]=i;if(i>>>0<l>>>0){do{l=d+4|0;d=l;i=(c[l>>2]|0)+1|0;c[l>>2]=i;}while((i|0)==0)}}else{d=j+((e*11|0)<<2)|0;i=j+((e*11|0)<<2)|0;j=a+(e<<1<<2)|0;e=f;bo(d,i,j,e)|0}return}function cm(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=c;c=e;e=bu(c,b,a,d)|0;return e+(bX(f,f,c,a)|0)|0}function cn(a,b,d,e,f,g,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0;k=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=j;j=f*3|0;l=j+1|0;if((h|0)!=0){m=bX(k+((f*7|0)<<2)|0,k+((f*7|0)<<2)|0,k+((f*15|0)<<2)|0,g)|0;n=k+((f*7|0)<<2)+(g<<2)|0;o=c[n>>2]|0;c[n>>2]=o-m;if(o>>>0<m>>>0){do{o=n+4|0;n=o;p=c[o>>2]|0;c[o>>2]=p-1;}while((p|0)==0)}m=co(b,k+((f*15|0)<<2)|0,g,14,i)|0;n=b+(g<<2)|0;p=c[n>>2]|0;c[n>>2]=p-m;if(p>>>0<m>>>0){do{p=n+4|0;n=p;o=c[p>>2]|0;c[p>>2]=o-1;}while((o|0)==0)}n=k+(j<<2)|0;o=c[n>>2]|0;c[n>>2]=o-((c[k+((f*15|0)<<2)>>2]|0)>>>2);if(o>>>0<(c[k+((f*15|0)<<2)>>2]|0)>>>2>>>0){do{o=n+4|0;n=o;p=c[o>>2]|0;c[o>>2]=p-1;}while((p|0)==0)}n=co(k+(j<<2)|0,k+((f*15|0)<<2)+4|0,g-1|0,30,i)|0;p=k+(j<<2)+(g<<2)-4|0;o=c[p>>2]|0;c[p>>2]=o-n;if(o>>>0<n>>>0){do{n=p+4|0;p=n;o=c[n>>2]|0;c[n>>2]=o-1;}while((o|0)==0)}m=co(k+((f*11|0)<<2)|0,k+((f*15|0)<<2)|0,g,28,i)|0;p=k+((f*11|0)<<2)+(g<<2)|0;o=c[p>>2]|0;c[p>>2]=o-m;if(o>>>0<m>>>0){do{o=p+4|0;p=o;n=c[o>>2]|0;c[o>>2]=n-1;}while((n|0)==0)}p=d;n=c[p>>2]|0;c[p>>2]=n-((c[k+((f*15|0)<<2)>>2]|0)>>>4);if(n>>>0<(c[k+((f*15|0)<<2)>>2]|0)>>>4>>>0){do{n=p+4|0;p=n;o=c[n>>2]|0;c[n>>2]=o-1;}while((o|0)==0)}p=co(d,k+((f*15|0)<<2)+4|0,g-1|0,28,i)|0;o=d+(g<<2)-4|0;n=c[o>>2]|0;c[o>>2]=n-p;if(n>>>0<p>>>0){do{p=o+4|0;o=p;n=c[p>>2]|0;c[p>>2]=n-1;}while((n|0)==0)}m=co(a+4|0,k+((f*15|0)<<2)|0,g,10,i)|0;m=bW(a+(g<<2)+4|0,a+(g<<2)+4|0,l-g-1|0,m)|0;m=c[e+(l<<2)>>2]|0;c[e+(l<<2)>>2]=128;o=e;n=c[o>>2]|0;c[o>>2]=n-((c[k+((f*15|0)<<2)>>2]|0)>>>6);if(n>>>0<(c[k+((f*15|0)<<2)>>2]|0)>>>6>>>0){do{n=o+4|0;o=n;p=c[n>>2]|0;c[n>>2]=p-1;}while((p|0)==0)}o=co(e,k+((f*15|0)<<2)+4|0,g-1|0,26,i)|0;p=e+(g<<2)-4|0;n=c[p>>2]|0;c[p>>2]=n-o;if(n>>>0<o>>>0){do{o=p+4|0;p=o;n=c[o>>2]|0;c[o>>2]=n-1;}while((n|0)==0)}c[e+(l<<2)>>2]=m}p=co(d+(f<<2)|0,k,f<<1,28,i)|0;n=d+(j<<2)|0;c[n>>2]=(c[n>>2]|0)-p;p=k+((f*11|0)<<2)+(f<<2)|0;n=c[p>>2]|0;c[p>>2]=n-((c[k>>2]|0)>>>4);if(n>>>0<(c[k>>2]|0)>>>4>>>0){do{n=p+4|0;p=n;o=c[n>>2]|0;c[n>>2]=o-1;}while((o|0)==0)}p=co(k+((f*11|0)<<2)+(f<<2)|0,k+4|0,(f<<1)-1|0,28,i)|0;o=k+((f*11|0)<<2)+(f<<2)+(f<<1<<2)-4|0;n=c[o>>2]|0;c[o>>2]=n-p;if(n>>>0<p>>>0){do{p=o+4|0;o=p;n=c[p>>2]|0;c[p>>2]=n-1;}while((n|0)==0)}bX(i,d,k+((f*11|0)<<2)|0,l)|0;bo(k+((f*11|0)<<2)|0,k+((f*11|0)<<2)|0,d,l)|0;o=d;d=i;i=o;o=co(k+(j<<2)+(f<<2)|0,k,f<<1,14,i)|0;n=k+(j<<2)+(j<<2)|0;c[n>>2]=(c[n>>2]|0)-o;o=b+(f<<2)|0;n=c[o>>2]|0;c[o>>2]=n-((c[k>>2]|0)>>>2);if(n>>>0<(c[k>>2]|0)>>>2>>>0){do{n=o+4|0;o=n;p=c[n>>2]|0;c[n>>2]=p-1;}while((p|0)==0)}o=co(b+(f<<2)|0,k+4|0,(f<<1)-1|0,30,i)|0;p=b+(f<<2)+(f<<1<<2)-4|0;n=c[p>>2]|0;c[p>>2]=n-o;if(n>>>0<o>>>0){do{o=p+4|0;p=o;n=c[o>>2]|0;c[o>>2]=n-1;}while((n|0)==0)}bo(i,b,k+(j<<2)|0,l)|0;bX(k+(j<<2)|0,k+(j<<2)|0,b,l)|0;p=b;b=i;i=p;m=co(e+(f<<2)+4|0,k,f<<1,10,i)|0;p=a+(f<<2)|0;n=c[p>>2]|0;c[p>>2]=n-((c[k>>2]|0)>>>6);if(n>>>0<(c[k>>2]|0)>>>6>>>0){do{n=p+4|0;p=n;o=c[n>>2]|0;c[n>>2]=o-1;}while((o|0)==0)}m=co(a+(f<<2)|0,k+4|0,(f<<1)-1|0,26,i)|0;m=bW(a+((f*3|0)<<2)-4|0,a+((f*3|0)<<2)-4|0,2,m)|0;bX(i,e,a,l)|0;bo(a,a,e,l)|0;p=e;e=i;i=p;p=bX(k+((f*7|0)<<2)+(f<<2)|0,k+((f*7|0)<<2)+(f<<2)|0,k,f<<1)|0;o=k+((f*7|0)<<2)+(j<<2)|0;c[o>>2]=(c[o>>2]|0)-p;bY(d,k+(j<<2)|0,l,1028)|0;bY(e,d,l,1300)|0;bY(e,k+(j<<2)|0,l,1052688)|0;br(e,e,l,188513325);cy(e,e,l,16843009,0)|0;bY(d,e,l,12567555)|0;br(d,d,l,181440);if((c[d+(j<<2)>>2]&-33554432|0)!=0){p=d+(j<<2)|0;c[p>>2]=c[p>>2]|-67108864}bY(k+(j<<2)|0,e,l,4095)|0;cx(k+(j<<2)|0,d,l,240)|0;br(k+(j<<2)|0,k+(j<<2)|0,l,1020);if((c[k+(j<<2)+(j<<2)>>2]&-536870912|0)!=0){p=k+(j<<2)+(j<<2)|0;c[p>>2]=c[p>>2]|-1073741824}co(b,k+((f*7|0)<<2)|0,l,7,i)|0;co(k+((f*11|0)<<2)|0,k+((f*7|0)<<2)|0,l,13,i)|0;bY(k+((f*11|0)<<2)|0,b,l,400)|0;co(a,k+((f*7|0)<<2)|0,l,19,i)|0;bY(a,k+((f*11|0)<<2)|0,l,1428)|0;bY(a,b,l,112896)|0;br(a,a,l,182712915);cy(a,a,l,16843009,0)|0;bY(k+((f*11|0)<<2)|0,a,l,15181425)|0;br(k+((f*11|0)<<2)|0,k+((f*11|0)<<2)|0,l,680400);bY(b,a,l,3969)|0;bY(b,k+((f*11|0)<<2)|0,l,900)|0;br(b,b,l,144);bX(k+((f*7|0)<<2)|0,k+((f*7|0)<<2)|0,a,l)|0;bX(k+((f*7|0)<<2)|0,k+((f*7|0)<<2)|0,b,l)|0;bX(k+((f*7|0)<<2)|0,k+((f*7|0)<<2)|0,k+((f*11|0)<<2)|0,l)|0;bo(k+(j<<2)|0,k+((f*11|0)<<2)|0,k+(j<<2)|0,l)|0;bN(k+(j<<2)|0,k+(j<<2)|0,l,1)|0;bX(k+((f*11|0)<<2)|0,k+((f*11|0)<<2)|0,k+(j<<2)|0,l)|0;bX(d,b,d,l)|0;bN(d,d,l,1)|0;bX(b,b,d,l)|0;bo(e,a,e,l)|0;bN(e,e,l,1)|0;bX(a,a,e,l)|0;m=bo(k+(f<<2)|0,k+(f<<2)|0,e,f)|0;m=bn(k+(f<<1<<2)|0,e+(f<<2)|0,f,m)|0;l=e+(f<<1<<2)|0;i=(c[l>>2]|0)+m|0;c[l>>2]=i;if(i>>>0<m>>>0){do{i=l+4|0;l=i;p=(c[i>>2]|0)+1|0;c[i>>2]=p;}while((p|0)==0)}l=c[e+(j<<2)>>2]|0;m=l+(bo(k+(j<<2)|0,k+(j<<2)|0,e+(f<<1<<2)|0,f)|0)|0;e=k+(f<<2<<2)|0;l=(c[e>>2]|0)+m|0;c[e>>2]=l;if(l>>>0<m>>>0){do{l=e+4|0;e=l;p=(c[l>>2]|0)+1|0;c[l>>2]=p;}while((p|0)==0)}e=bo(k+((f*5|0)<<2)|0,k+((f*5|0)<<2)|0,d,f)|0;p=k+(j<<1<<2)|0;c[p>>2]=(c[p>>2]|0)+e;m=bn(k+(j<<1<<2)|0,d+(f<<2)|0,f,c[k+(j<<1<<2)>>2]|0)|0;e=d+(f<<1<<2)|0;p=(c[e>>2]|0)+m|0;c[e>>2]=p;if(p>>>0<m>>>0){do{p=e+4|0;e=p;l=(c[p>>2]|0)+1|0;c[p>>2]=l;}while((l|0)==0)}e=c[d+(j<<2)>>2]|0;m=e+(bo(k+((f*7|0)<<2)|0,k+((f*7|0)<<2)|0,d+(f<<1<<2)|0,f)|0)|0;d=k+(f<<3<<2)|0;e=(c[d>>2]|0)+m|0;c[d>>2]=e;if(e>>>0<m>>>0){do{e=d+4|0;d=e;l=(c[e>>2]|0)+1|0;c[e>>2]=l;}while((l|0)==0)}d=bo(k+((f*9|0)<<2)|0,k+((f*9|0)<<2)|0,b,f)|0;l=k+((f*10|0)<<2)|0;c[l>>2]=(c[l>>2]|0)+d;m=bn(k+((f*10|0)<<2)|0,b+(f<<2)|0,f,c[k+((f*10|0)<<2)>>2]|0)|0;d=b+(f<<1<<2)|0;l=(c[d>>2]|0)+m|0;c[d>>2]=l;if(l>>>0<m>>>0){do{l=d+4|0;d=l;e=(c[l>>2]|0)+1|0;c[l>>2]=e;}while((e|0)==0)}d=c[b+(j<<2)>>2]|0;m=d+(bo(k+((f*11|0)<<2)|0,k+((f*11|0)<<2)|0,b+(f<<1<<2)|0,f)|0)|0;b=k+((f*12|0)<<2)|0;d=(c[b>>2]|0)+m|0;c[b>>2]=d;if(d>>>0<m>>>0){do{d=b+4|0;b=d;e=(c[d>>2]|0)+1|0;c[d>>2]=e;}while((e|0)==0)}b=bo(k+((f*13|0)<<2)|0,k+((f*13|0)<<2)|0,a,f)|0;e=k+((f*14|0)<<2)|0;c[e>>2]=(c[e>>2]|0)+b;if((h|0)==0){h=k+((f*14|0)<<2)|0;b=a+(f<<2)|0;e=g;d=c[k+((f*14|0)<<2)>>2]|0;bn(h,b,e,d)|0;return}m=bn(k+((f*14|0)<<2)|0,a+(f<<2)|0,f,c[k+((f*14|0)<<2)>>2]|0)|0;d=a+(f<<1<<2)|0;e=(c[d>>2]|0)+m|0;c[d>>2]=e;if(e>>>0<m>>>0){do{e=d+4|0;d=e;b=(c[e>>2]|0)+1|0;c[e>>2]=b;}while((b|0)==0)}if((((g|0)>(f|0)|0)!=0|0)!=0){d=c[a+(j<<2)>>2]|0;m=d+(bo(k+((f*15|0)<<2)|0,k+((f*15|0)<<2)|0,a+(f<<1<<2)|0,f)|0)|0;d=k+(f<<4<<2)|0;j=(c[d>>2]|0)+m|0;c[d>>2]=j;if(j>>>0<m>>>0){do{m=d+4|0;d=m;j=(c[m>>2]|0)+1|0;c[m>>2]=j;}while((j|0)==0)}}else{d=k+((f*15|0)<<2)|0;j=k+((f*15|0)<<2)|0;k=a+(f<<1<<2)|0;f=g;bo(d,j,k,f)|0}return}function co(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=c;c=e;e=bu(c,b,a,d)|0;return e+(bX(f,f,c,a)|0)|0}function cp(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=d+d|0;j=h+1|0;k=i+(d<<2)|0;l=k+(d<<2)|0;m=l+(d<<2)|0;n=m+(d<<2)|0;if((f|0)!=0){o=a;p=a;q=b;r=j;bo(o,p,q,r)|0}else{r=a;q=a;p=b;o=j;bX(r,q,p,o)|0}cy(a,a,j,1431655765,0)|0;if((f|0)!=0){f=b;o=l;p=b;q=j;bo(f,o,p,q)|0;q=b;p=b;o=j;bN(q,p,o,1)|0}else{o=b;p=l;q=b;f=j;bX(o,p,q,f)|0;f=b;q=b;p=j;bN(f,q,p,1)|0}p=bX(l,l,i,h)|0;h=n|0;c[h>>2]=(c[h>>2]|0)-p;bX(a,a,l,j)|0;bN(a,a,j,1)|0;bX(l,l,b,j)|0;p=bo(k,k,b,j)|0;h=m+4|0;i=(c[h>>2]|0)+p|0;c[h>>2]=i;if(i>>>0<p>>>0){do{i=h+4|0;h=i;q=(c[i>>2]|0)+1|0;c[i>>2]=q;}while((q|0)==0)}h=c[n>>2]|0;c[n>>2]=g;p=bu(b,n,e,1)|0;p=p+(bX(a,a,b,e)|0)|0;b=a+(e<<2)|0;q=c[b>>2]|0;c[b>>2]=q-p;if(q>>>0<p>>>0){do{q=b+4|0;b=q;i=c[q>>2]|0;c[q>>2]=i-1;}while((i|0)==0)}if((((e|0)>(d+1|0)|0)!=0|0)!=0){p=bo(n,n,a+(d<<2)|0,d+1|0)|0;b=m+(j<<2)|0;j=(c[b>>2]|0)+p|0;c[b>>2]=j;if(j>>>0<p>>>0){do{j=b+4|0;b=j;i=(c[j>>2]|0)+1|0;c[j>>2]=i;}while((i|0)==0)}}else{b=n;i=n;j=a+(d<<2)|0;q=e;bo(b,i,j,q)|0}p=bX(l,l,n,e)|0;g=c[n>>2]|0;c[n>>2]=h;h=l+(e<<2)|0;e=c[h>>2]|0;c[h>>2]=e-p;if(e>>>0<p>>>0){do{e=h+4|0;h=e;q=c[e>>2]|0;c[e>>2]=q-1;}while((q|0)==0)}p=bX(k,k,a,d)|0;k=l;l=c[k>>2]|0;c[k>>2]=l-p;if(l>>>0<p>>>0){do{l=k+4|0;k=l;h=c[l>>2]|0;c[l>>2]=h-1;}while((h|0)==0)}p=bo(m,m,a,d)|0;d=n|0;c[d>>2]=(c[d>>2]|0)+p;p=n;n=(c[p>>2]|0)+g|0;c[p>>2]=n;if(n>>>0<g>>>0){do{g=p+4|0;p=g;n=(c[g>>2]|0)+1|0;c[g>>2]=n;}while((n|0)==0)}return}function cq(a,b,d,e,f,g,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;k=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=j;j=(a<<1)+1|0;bo(g,g,f,j)|0;if((b&1|0)!=0){l=d;m=d;n=f;o=j;bo(l,m,n,o)|0;o=d;n=d;m=j;bN(o,n,m,1)|0}else{m=d;n=f;o=d;l=j;bX(m,n,o,l)|0;l=d;o=d;n=j;bN(l,o,n,1)|0}a6(f,f,j,k,a<<1)|0;bX(f,f,d,j)|0;bN(f,f,j,2)|0;c[i+(h<<2)>>2]=bu(i,k+((a*6|0)<<2)|0,h,4)|0;a6(f,f,j,i,h+1|0)|0;if((b&2|0)!=0){b=e;n=e;o=k+(a<<1<<2)|0;l=j;bo(b,n,o,l)|0;l=e;o=e;n=j;bN(l,o,n,1)|0}else{n=e;o=k+(a<<1<<2)|0;l=e;b=j;bX(n,o,l,b)|0;b=e;l=e;o=j;bN(b,l,o,1)|0}bX(k+(a<<1<<2)|0,k+(a<<1<<2)|0,e,j)|0;bY(g,k+(a<<1<<2)|0,j,65)|0;a6(k+(a<<1<<2)|0,k+(a<<1<<2)|0,j,k+((a*6|0)<<2)|0,h)|0;a6(k+(a<<1<<2)|0,k+(a<<1<<2)|0,j,k,a<<1)|0;cx(g,k+(a<<1<<2)|0,j,45)|0;bN(g,g,j,1)|0;bX(f,f,k+(a<<1<<2)|0,j)|0;cy(f,f,j,1431655765,0)|0;bX(k+(a<<1<<2)|0,k+(a<<1<<2)|0,f,j)|0;bX(d,g,d,j)|0;bu(i,e,j,3)|0;bX(g,g,i,j)|0;br(g,g,j,9);bX(e,e,g,j)|0;cy(d,d,j,286331153,0)|0;bo(d,d,g,j)|0;bN(d,d,j,1)|0;bX(g,g,d,j)|0;i=bo(k+(a<<2)|0,k+(a<<2)|0,d,j)|0;j=k+(a<<1<<2)+(a<<2)+4|0;d=(c[j>>2]|0)+i|0;c[j>>2]=d;if(d>>>0<i>>>0){do{d=j+4|0;j=d;o=(c[d>>2]|0)+1|0;c[d>>2]=o;}while((o|0)==0)}i=bo(k+((a*3|0)<<2)|0,k+((a*3|0)<<2)|0,e,a)|0;j=e+(a<<2)|0;o=(c[j>>2]|0)+((c[k+(a<<1<<2)+(a<<1<<2)>>2]|0)+i)|0;c[j>>2]=o;if(o>>>0<((c[k+(a<<1<<2)+(a<<1<<2)>>2]|0)+i|0)>>>0){do{o=j+4|0;j=o;d=(c[o>>2]|0)+1|0;c[o>>2]=d;}while((d|0)==0)}i=bo(k+(a<<2<<2)|0,e+(a<<2)|0,f,a)|0;j=f+(a<<2)|0;d=(c[j>>2]|0)+((c[e+(a<<1<<2)>>2]|0)+i)|0;c[j>>2]=d;if(d>>>0<((c[e+(a<<1<<2)>>2]|0)+i|0)>>>0){do{e=j+4|0;j=e;d=(c[e>>2]|0)+1|0;c[e>>2]=d;}while((d|0)==0)}i=bo(k+((a*5|0)<<2)|0,f+(a<<2)|0,g,a)|0;j=g+(a<<2)|0;d=(c[j>>2]|0)+((c[f+(a<<1<<2)>>2]|0)+i)|0;c[j>>2]=d;if(d>>>0<((c[f+(a<<1<<2)>>2]|0)+i|0)>>>0){do{i=j+4|0;j=i;f=(c[i>>2]|0)+1|0;c[i>>2]=f;}while((f|0)==0)}if((h|0)>(a+1|0)){j=k+((a*6|0)<<2)|0;f=k+((a*6|0)<<2)|0;i=h;d=g+(a<<2)|0;e=a+1|0;a5(j,f,i,d,e)|0;return}else{e=k+((a*6|0)<<2)|0;d=k+((a*6|0)<<2)|0;k=g+(a<<2)|0;a=h;bo(e,d,k,a)|0;return}}function cr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;e=a;a=b;if((a|0)>1){f=a}else{f=1}a=f;if(((a>>>0>134217727|0)!=0|0)!=0){f=c[m>>2]|0;au(f|0,632,(f=i,i=i+1|0,i=i+7&-8,c[f>>2]=0,f)|0)|0;i=f;at();return 0}f=aC[c[1584]&3](c[e+8>>2]|0,c[e>>2]<<2,a<<2)|0;c[e+8>>2]=f;c[e>>2]=a;if((c[e+4>>2]|0)>=0){g=c[e+4>>2]|0}else{g=-(c[e+4>>2]|0)|0}if((g|0)<=(a|0)){h=f;j=h;i=d;return j|0}c[e+4>>2]=0;h=f;j=h;i=d;return j|0}function cs(a,b){a=a|0;b=b|0;var d=0;d=a;a=b+8|0;b=az[c[1736]&3](a)|0;c[b+4>>2]=a;c[b>>2]=c[d>>2];c[d>>2]=b;return b+8|0}function ct(a){a=a|0;var b=0;b=a;while(1){if((b|0)==0){break}a=c[b>>2]|0;aB[c[1586]&3](b,c[b+4>>2]|0);b=a}return}function cu(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;g=i;i=i+136|0;h=g|0;j=g+120|0;k=g+128|0;l=a;a=b;b=d;d=e;e=f;if((b|0)==(e|0)){if((a|0)==(d|0)){bP(l,a,b)}else{bD(l,a,d,b)}m=b;n=e;o=m+n|0;p=o-1|0;q=l;r=q+(p<<2)|0;s=c[r>>2]|0;i=g;return s|0}if((e|0)<30){do{if((b|0)<=500){t=3912}else{if((e|0)==1){t=3912;break}cE(l,a,500,d,e);l=l+2e3|0;if((e|0)!=0){f=e-1|0;u=h|0;v=l;w=v;v=w+4|0;x=c[w>>2]|0;if((f|0)!=0){do{w=u;u=w+4|0;c[w>>2]=x;w=v;v=w+4|0;x=c[w>>2]|0;w=f-1|0;f=w;}while((w|0)!=0)}f=u;u=f+4|0;c[f>>2]=x}a=a+2e3|0;b=b-500|0;while(1){if((b|0)<=500){break}cE(l,a,500,d,e);y=bo(l,l,h|0,e)|0;f=l+(e<<2)|0;v=(c[f>>2]|0)+y|0;c[f>>2]=v;if(v>>>0<y>>>0){do{v=f+4|0;f=v;w=(c[v>>2]|0)+1|0;c[v>>2]=w;}while((w|0)==0)}l=l+2e3|0;if((e|0)!=0){f=e-1|0;w=h|0;v=l;z=v;v=z+4|0;A=c[z>>2]|0;if((f|0)!=0){do{z=w;w=z+4|0;c[z>>2]=A;z=v;v=z+4|0;A=c[z>>2]|0;z=f-1|0;f=z;}while((z|0)!=0)}f=w;w=f+4|0;c[f>>2]=A}a=a+2e3|0;b=b-500|0}if((b|0)>(e|0)){cE(l,a,b,d,e)}else{cE(l,d,e,a,b)}y=bo(l,l,h|0,e)|0;x=l+(e<<2)|0;u=(c[x>>2]|0)+y|0;c[x>>2]=u;if(u>>>0<y>>>0){do{u=x+4|0;x=u;f=(c[u>>2]|0)+1|0;c[u>>2]=f;}while((f|0)==0)}}}while(0);if((t|0)==3912){cE(l,a,b,d,e)}}else{if((e|0)>=100){do{if((b+e>>1|0)>=3e3){if((e*3|0|0)<3e3){t=4043;break}if((b|0)>=(e<<3|0)){c[k>>2]=0;y=cs(k,(e*9|0)>>1<<2)|0;bJ(l,a,e*3|0,d,e);b=b-(e*3|0)|0;a=a+((e*3|0)<<2)|0;l=l+((e*3|0)<<2)|0;while(1){if((b<<1|0)<(e*7|0|0)){break}bJ(y,a,e*3|0,d,e);b=b-(e*3|0)|0;a=a+((e*3|0)<<2)|0;B=bo(l,l,y,e)|0;if((e*3|0|0)!=0){h=(e*3|0)-1|0;x=l+(e<<2)|0;f=y+(e<<2)|0;u=f;f=u+4|0;v=c[u>>2]|0;if((h|0)!=0){do{u=x;x=u+4|0;c[u>>2]=v;u=f;f=u+4|0;v=c[u>>2]|0;u=h-1|0;h=u;}while((u|0)!=0)}h=x;x=h+4|0;c[h>>2]=v}h=l+(e<<2)|0;f=(c[h>>2]|0)+B|0;c[h>>2]=f;if(f>>>0<B>>>0){do{f=h+4|0;h=f;A=(c[f>>2]|0)+1|0;c[f>>2]=A;}while((A|0)==0)}l=l+((e*3|0)<<2)|0}if((b|0)<(e|0)){h=y;v=d;x=e;A=a;f=b;cu(h,v,x,A,f)|0}else{f=y;A=a;x=b;v=d;h=e;cu(f,A,x,v,h)|0}B=bo(l,l,y,e)|0;if((b|0)!=0){h=b-1|0;v=l+(e<<2)|0;x=y+(e<<2)|0;A=x;x=A+4|0;f=c[A>>2]|0;if((h|0)!=0){do{A=v;v=A+4|0;c[A>>2]=f;A=x;x=A+4|0;f=c[A>>2]|0;A=h-1|0;h=A;}while((A|0)!=0)}h=v;v=h+4|0;c[h>>2]=f}h=l+(e<<2)|0;x=(c[h>>2]|0)+B|0;c[h>>2]=x;if(x>>>0<B>>>0){do{x=h+4|0;h=x;y=(c[x>>2]|0)+1|0;c[x>>2]=y;}while((y|0)==0)}if((((c[k>>2]|0)!=0|0)!=0|0)!=0){ct(c[k>>2]|0)}}else{bJ(l,a,b,d,e)}}else{t=4043}}while(0);if((t|0)==4043){do{if((e|0)>=300){if(((b*3|0)+12|0)>=(e<<2|0)){t=4045;break}c[j>>2]=0;if((e|0)>=350){if((e|0)>=450){if((((cw(b,e)|0)<<2>>>0<65536|0)!=0|0)!=0){k=(cw(b,e)|0)<<2;B=i;i=i+k|0;i=i+7&-8;C=B}else{C=cs(j,(cw(b,e)|0)<<2)|0}D=C;cc(l,a,b,d,e,D)}else{if((((cv(b,e)|0)<<2>>>0<65536|0)!=0|0)!=0){B=(cv(b,e)|0)<<2;k=i;i=i+B|0;i=i+7&-8;E=k}else{E=cs(j,(cv(b,e)|0)<<2)|0}D=E;ca(l,a,b,d,e,D)}}else{if((((b*3|0)+32<<2>>>0<65536|0)!=0|0)!=0){k=i;i=i+((b*3|0)+32<<2)|0;i=i+7&-8;F=k}else{F=cs(j,(b*3|0)+32<<2)|0}D=F;b7(l,a,b,d,e,D)}if((((c[j>>2]|0)!=0|0)!=0|0)!=0){ct(c[j>>2]|0)}}else{t=4045}}while(0);if((t|0)==4045){t=i;i=i+((e<<4)+100<<2)|0;i=i+7&-8;j=t;if((b<<1|0)>=(e*5|0|0)){t=i;i=i+((e*7|0)>>1<<2)|0;i=i+7&-8;D=t;if((e|0)>=110){c_(l,a,e<<1,d,e,j)}else{cW(l,a,e<<1,d,e,j)}b=b-(e<<1)|0;a=a+(e<<1<<2)|0;l=l+(e<<1<<2)|0;while(1){if((b<<1|0)<(e*5|0|0)){break}if((e|0)>=110){c_(D,a,e<<1,d,e,j)}else{cW(D,a,e<<1,d,e,j)}b=b-(e<<1)|0;a=a+(e<<1<<2)|0;G=bo(l,l,D,e)|0;if((e<<1|0)!=0){t=(e<<1)-1|0;F=l+(e<<2)|0;E=D+(e<<2)|0;C=E;E=C+4|0;k=c[C>>2]|0;if((t|0)!=0){do{C=F;F=C+4|0;c[C>>2]=k;C=E;E=C+4|0;k=c[C>>2]|0;C=t-1|0;t=C;}while((C|0)!=0)}t=F;F=t+4|0;c[t>>2]=k}t=l+(e<<2)|0;E=(c[t>>2]|0)+G|0;c[t>>2]=E;if(E>>>0<G>>>0){do{E=t+4|0;t=E;C=(c[E>>2]|0)+1|0;c[E>>2]=C;}while((C|0)==0)}l=l+(e<<1<<2)|0}if((b|0)<(e|0)){t=D;k=d;F=e;C=a;E=b;cu(t,k,F,C,E)|0}else{E=D;C=a;F=b;k=d;t=e;cu(E,C,F,k,t)|0}G=bo(l,l,D,e)|0;if((b|0)!=0){t=b-1|0;k=l+(e<<2)|0;F=D+(e<<2)|0;D=F;F=D+4|0;C=c[D>>2]|0;if((t|0)!=0){do{D=k;k=D+4|0;c[D>>2]=C;D=F;F=D+4|0;C=c[D>>2]|0;D=t-1|0;t=D;}while((D|0)!=0)}t=k;k=t+4|0;c[t>>2]=C}C=l+(e<<2)|0;t=(c[C>>2]|0)+G|0;c[C>>2]=t;if(t>>>0<G>>>0){do{G=C+4|0;C=G;t=(c[G>>2]|0)+1|0;c[G>>2]=t;}while((t|0)==0)}}else{if((b*6|0|0)<(e*7|0|0)){b5(l,a,b,d,e,j)}else{if((b<<1|0)<(e*3|0|0)){if((e|0)>=100){cY(l,a,b,d,e,j)}else{b1(l,a,b,d,e,j)}}else{if((b*6|0|0)<(e*11|0|0)){if((b<<2|0)<(e*7|0|0)){if((e|0)>=110){cZ(l,a,b,d,e,j)}else{b1(l,a,b,d,e,j)}}else{if((e|0)>=100){cZ(l,a,b,d,e,j)}else{cW(l,a,b,d,e,j)}}}else{if((e|0)>=110){c_(l,a,b,d,e,j)}else{cW(l,a,b,d,e,j)}}}}}}}}else{j=i;i=i+((e<<4)+100<<2)|0;i=i+7&-8;C=j;if((b|0)>=(e*3|0|0)){j=i;i=i+(e<<2<<2)|0;i=i+7&-8;t=j;cW(l,a,e<<1,d,e,C);b=b-(e<<1)|0;a=a+(e<<1<<2)|0;l=l+(e<<1<<2)|0;while(1){if((b|0)<(e*3|0|0)){break}cW(t,a,e<<1,d,e,C);b=b-(e<<1)|0;a=a+(e<<1<<2)|0;H=bo(l,l,t,e)|0;if((e<<1|0)!=0){j=(e<<1)-1|0;G=l+(e<<2)|0;k=t+(e<<2)|0;F=k;k=F+4|0;D=c[F>>2]|0;if((j|0)!=0){do{F=G;G=F+4|0;c[F>>2]=D;F=k;k=F+4|0;D=c[F>>2]|0;F=j-1|0;j=F;}while((F|0)!=0)}j=G;G=j+4|0;c[j>>2]=D}j=l+(e<<2)|0;k=(c[j>>2]|0)+H|0;c[j>>2]=k;if(k>>>0<H>>>0){do{k=j+4|0;j=k;F=(c[k>>2]|0)+1|0;c[k>>2]=F;}while((F|0)==0)}l=l+(e<<1<<2)|0}if((b<<2|0)<(e*5|0|0)){bZ(t,a,b,d,e,C)}else{if((b<<2|0)<(e*7|0|0)){b1(t,a,b,d,e,C)}else{cW(t,a,b,d,e,C)}}H=bo(l,l,t,e)|0;if((b|0)!=0){j=b-1|0;D=l+(e<<2)|0;G=t+(e<<2)|0;t=G;G=t+4|0;F=c[t>>2]|0;if((j|0)!=0){do{t=D;D=t+4|0;c[t>>2]=F;t=G;G=t+4|0;F=c[t>>2]|0;t=j-1|0;j=t;}while((t|0)!=0)}j=D;D=j+4|0;c[j>>2]=F}F=l+(e<<2)|0;j=(c[F>>2]|0)+H|0;c[F>>2]=j;if(j>>>0<H>>>0){do{H=F+4|0;F=H;j=(c[H>>2]|0)+1|0;c[H>>2]=j;}while((j|0)==0)}}else{if((b<<2|0)<(e*5|0|0)){bZ(l,a,b,d,e,C)}else{if((b<<2|0)<(e*7|0|0)){b1(l,a,b,d,e,C)}else{cW(l,a,b,d,e,C)}}}}}m=b;n=e;o=m+n|0;p=o-1|0;q=l;r=q+(p<<2)|0;s=c[r>>2]|0;i=g;return s|0}function cv(a,b){a=a|0;b=b|0;return((((((a+b|0)>>>0)/10|0)+1|0)*6|0)-350<<1)+1082|0}function cw(a,b){a=a|0;b=b|0;return((((((a+b|0)>>>0)/14|0)+1<<3)*15|0)>>3)-843+1282|0}function cx(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=0;do{g=a;a=g+4|0;h=c[g>>2]|0;g=d;i=h&65535;j=h>>>16;h=g&65535;k=g>>>16;g=_(i,h)|0;l=_(i,k)|0;i=_(j,h)|0;h=_(j,k)|0;l=l+(g>>>16)|0;l=l+i|0;if(l>>>0<i>>>0){h=h+65536|0}i=(l<<16)+(g&65535)|0;i=i+e|0;e=(i>>>0<e>>>0)+(h+(l>>>16))|0;l=c[f>>2]|0;i=l+i|0;e=e+(i>>>0<l>>>0)|0;l=f;f=l+4|0;c[l>>2]=i;i=b-1|0;b=i;}while((i|0)!=0);return e|0}function cy(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=a;a=b;b=d;d=e;e=f;f=0;while(1){if((f|0)>=(b|0)){break}h=c[a+(f<<2)>>2]|0;i=d<<0;j=h&65535;k=h>>>16;h=i&65535;l=i>>>16;i=_(j,h)|0;m=_(j,l)|0;j=_(k,h)|0;h=_(k,l)|0;m=m+(i>>>16)|0;m=m+j|0;if(m>>>0<j>>>0){h=h+65536|0}j=(m<<16)+(i&65535)|0;j=j>>>0;i=e>>>0<j>>>0|0;e=e-j|0;c[g+(f<<2)>>2]=e;e=e-(h+(m>>>16))-i|0;f=f+1|0}return e|0}function cz(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+104|0;g=f|0;h=f+96|0;j=a;a=b;b=d;d=e;e=g|0;k=b;do{c[e>>2]=k;k=(k>>1)+1|0;e=e+4|0;}while((k|0)>=200);a=a+(b<<2)|0;j=j+(b<<2)|0;cA(j+(-k<<2)|0,a+(-k<<2)|0,k,d)|0;c[h>>2]=0;l=bI(b+1|0)|0;if((((cB(l,b,(b>>1)+1|0)|0)<<2>>>0<65536|0)!=0|0)!=0){m=(cB(l,b,(b>>1)+1|0)|0)<<2;n=i;i=i+m|0;i=i+7&-8;o=n}else{o=cs(h,(cB(l,b,(b>>1)+1|0)|0)<<2)|0}n=o;o=d+(b<<2)+12|0;while(1){m=e-4|0;e=m;b=c[m>>2]|0;m=bI(b+1|0)|0;l=m;if((m|0)>(b+k|0)){m=o;p=a+(-b<<2)|0;q=b;r=j+(-k<<2)|0;s=k;cu(m,p,q,r,s)|0;s=o+(k<<2)|0;r=o+(k<<2)|0;q=a+(-b<<2)|0;p=b-k+1|0;bo(s,r,q,p)|0;t=1}else{bF(o,l,a+(-b<<2)|0,b,j+(-k<<2)|0,k,n);c[o+(l<<2)>>2]=(bo(o+(k<<2)|0,o+(k<<2)|0,a+(-b<<2)|0,l-k|0)|0)+1;u=bo(o,o,a+(-(b-(l-k)|0)<<2)|0,b-(l-k)|0)|0;p=o+(b<<2)+(-(l-k|0)<<2)|0;q=(c[p>>2]|0)+u|0;c[p>>2]=q;if(q>>>0<u>>>0){do{q=p+4|0;p=q;r=(c[q>>2]|0)+1|0;c[q>>2]=r;}while((r|0)==0)}p=o+(k<<2)+(b<<2)+(-l<<2)|0;do{r=p;p=r+4|0;q=c[r>>2]|0;c[r>>2]=q-1;}while((q|0)==0);if((c[o+(l<<2)>>2]|0)!=0){p=o;q=(c[p>>2]|0)+((c[o+(l<<2)>>2]|0)-1)|0;c[p>>2]=q;if(q>>>0<((c[o+(l<<2)>>2]|0)-1|0)>>>0){do{q=p+4|0;p=q;r=(c[q>>2]|0)+1|0;c[q>>2]=r;}while((r|0)==0)}}else{p=o;do{r=p;p=r+4|0;q=c[r>>2]|0;c[r>>2]=q-1;}while((q|0)==0)}t=0}if((c[o+(b<<2)>>2]|0)>>>0<2){u=1;while(1){if((c[o+(b<<2)>>2]|0)!=0){v=1}else{v=(be(o,a+(-b<<2)|0,b)|0)>0}if(!v){break}p=bX(o,o,a+(-b<<2)|0,b)|0;q=o+(b<<2)|0;c[q>>2]=(c[q>>2]|0)-p;u=u+1|0}p=j+(-k<<2)|0;q=c[p>>2]|0;c[p>>2]=q-u;if(q>>>0<u>>>0){do{q=p+4|0;p=q;r=c[q>>2]|0;c[q>>2]=r-1;}while((r|0)==0)}bX(o,a+(-b<<2)|0,o,b)|0}else{p=o;r=o;q=b+1|0;do{s=r;r=s+4|0;m=p;p=m+4|0;c[m>>2]=~c[s>>2];s=q-1|0;q=s;}while((s|0)!=0);q=o;p=(c[q>>2]|0)+t|0;c[q>>2]=p;if(p>>>0<t>>>0){do{p=q+4|0;q=p;r=(c[p>>2]|0)+1|0;c[p>>2]=r;}while((r|0)==0)}if((c[o+(b<<2)>>2]|0)!=0){q=j+(-k<<2)|0;do{r=q;q=r+4|0;p=(c[r>>2]|0)+1|0;c[r>>2]=p;}while((p|0)==0);bX(o,o,a+(-b<<2)|0,b)|0}}bD(d,o+(b<<2)+(-k<<2)|0,j+(-k<<2)|0,k);u=bo(d+(k<<2)|0,d+(k<<2)|0,o+(b<<2)+(-k<<2)|0,(k<<1)-b|0)|0;u=cC(j+(-b<<2)|0,d+((k*3|0)<<2)+(-b<<2)|0,o+(k<<2)|0,b-k|0,u)|0;q=j+(-k<<2)|0;p=(c[q>>2]|0)+(u+0)|0;c[q>>2]=p;if(p>>>0<(u+0|0)>>>0){do{p=q+4|0;q=p;r=(c[p>>2]|0)+1|0;c[p>>2]=r;}while((r|0)==0)}if((e|0)==(g|0)){break}k=b}u=(c[d+((k*3|0)-b-1<<2)>>2]|0)>>>0>4294967288|0;if((((c[h>>2]|0)!=0|0)!=0|0)!=0){ct(c[h>>2]|0)}i=f;return u|0}function cA(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;do{if((b|0)==1){e=(c[a>>2]|0)>>>16;j=c[a>>2]&65535;k=(~c[a>>2]>>>0)/(e>>>0)|0;l=~c[a>>2];m=l-(_(k,e)|0)|0;l=_(k,j)|0;m=m<<16|65535;if(m>>>0<l>>>0){k=k-1|0;m=m+(c[a>>2]|0)|0;if(m>>>0>=(c[a>>2]|0)>>>0){if(m>>>0<l>>>0){k=k-1|0;m=m+(c[a>>2]|0)|0}}}m=m-l|0;n=(m>>>0)/(e>>>0)|0;o=m-(_(n,e)|0)|0;l=_(n,j)|0;o=o<<16|65535;if(o>>>0<l>>>0){n=n-1|0;o=o+(c[a>>2]|0)|0;if(o>>>0>=(c[a>>2]|0)>>>0){if(o>>>0<l>>>0){n=n-1|0;o=o+(c[a>>2]|0)|0}}}o=o-l|0;c[h>>2]=k<<16|n;}else{n=d+(b<<2)+8|0;k=b-1|0;while(1){if((k|0)<0){break}c[n+(k<<2)>>2]=-1;k=k-1|0}k=n+(b<<2)|0;l=a;o=b;do{j=l;l=j+4|0;e=k;k=e+4|0;c[e>>2]=~c[j>>2];j=o-1|0;o=j;}while((j|0)!=0);if((b|0)==2){o=h;k=n;l=a;bt(o,0,k,4,l)|0;break}l=(c[a+(b-1<<2)>>2]|0)>>>16;k=c[a+(b-1<<2)>>2]&65535;o=(~c[a+(b-1<<2)>>2]>>>0)/(l>>>0)|0;j=~c[a+(b-1<<2)>>2];e=j-(_(o,l)|0)|0;j=_(o,k)|0;e=e<<16|65535;if(e>>>0<j>>>0){o=o-1|0;e=e+(c[a+(b-1<<2)>>2]|0)|0;if(e>>>0>=(c[a+(b-1<<2)>>2]|0)>>>0){if(e>>>0<j>>>0){o=o-1|0;e=e+(c[a+(b-1<<2)>>2]|0)|0}}}e=e-j|0;m=(e>>>0)/(l>>>0)|0;p=e-(_(m,l)|0)|0;j=_(m,k)|0;p=p<<16|65535;if(p>>>0<j>>>0){m=m-1|0;p=p+(c[a+(b-1<<2)>>2]|0)|0;if(p>>>0>=(c[a+(b-1<<2)>>2]|0)>>>0){if(p>>>0<j>>>0){m=m-1|0;p=p+(c[a+(b-1<<2)>>2]|0)|0}}}p=p-j|0;j=o<<16|m;m=_(c[a+(b-1<<2)>>2]|0,j)|0;m=m+(c[a+(b-2<<2)>>2]|0)|0;if(m>>>0<(c[a+(b-2<<2)>>2]|0)>>>0){j=j-1|0;o=-(m>>>0>=(c[a+(b-1<<2)>>2]|0)>>>0|0)|0;m=m-(c[a+(b-1<<2)>>2]|0)|0;j=j+o|0;m=m-(o&c[a+(b-1<<2)>>2])|0}o=c[a+(b-2<<2)>>2]|0;p=j;k=o&65535;l=o>>>16;o=p&65535;e=p>>>16;p=_(k,o)|0;q=_(k,e)|0;k=_(l,o)|0;o=_(l,e)|0;q=q+(p>>>16)|0;q=q+k|0;if(q>>>0<k>>>0){o=o+65536|0}k=o+(q>>>16)|0;o=(q<<16)+(p&65535)|0;m=m+k|0;if(m>>>0<k>>>0){j=j-1|0;if(((m>>>0>=(c[a+(b-1<<2)>>2]|0)>>>0|0)!=0|0)!=0){if(m>>>0>(c[a+(b-1<<2)>>2]|0)>>>0){r=4437}else{if(o>>>0>=(c[a+(b-2<<2)>>2]|0)>>>0){r=4437}}if((r|0)==4437){j=j-1|0}}}c[g>>2]=j;cV(h,n,b<<1,a,b,c[g>>2]|0)|0;j=h;do{o=j;j=o+4|0;m=c[o>>2]|0;c[o>>2]=m-1;}while((m|0)==0);s=1;t=s;i=f;return t|0}}while(0);s=0;t=s;i=f;return t|0}function cB(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function cC(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=bo(f,b,c,a)|0;d=d+(bn(f,f,a,e)|0)|0;return d|0}function cD(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;c[g>>2]=0;if((d|0)==0){if((((b*3|0)+2<<2>>>0<65536|0)!=0|0)!=0){e=i;i=i+((b*3|0)+2<<2)|0;i=i+7&-8;j=e}else{j=cs(g,(b*3|0)+2<<2)|0}d=j}if((b|0)>=200){k=cz(h,a,b,d)|0}else{k=cA(h,a,b,d)|0}if((((c[g>>2]|0)!=0|0)!=0|0)!=0){ct(c[g>>2]|0)}i=f;return k|0}function cE(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;a=b;b=d;d=e;e=f;c[g+(b<<2)>>2]=bC(g,a,b,c[d>>2]|0)|0;g=g+4|0;d=d+4|0;e=e-1|0;while(1){if((e|0)<1){break}c[g+(b<<2)>>2]=cx(g,a,b,c[d>>2]|0)|0;g=g+4|0;d=d+4|0;e=e-1|0}return}function cF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=0;while(1){if((c[8+(a<<6)+(b<<2)>>2]|0)==0){break}if((d|0)<(c[8+(a<<6)+(b<<2)>>2]|0)){e=4498;break}b=b+1|0}if((e|0)==4498){f=b+4|0;g=f;return g|0}do{if((b|0)!=0){if((d|0)<(c[8+(a<<6)+(b-1<<2)>>2]<<2|0)){break}f=b+5|0;g=f;return g|0}}while(0);f=b+4|0;g=f;return g|0}function cG(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;c=(c-1>>a)+1|0;return c<<a|0}function cH(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=i;i=i+8|0;k=j|0;l=a;a=b;b=d;d=e;e=f;f=g;g=h;if((b|0)==(e|0)){m=(d|0)==(f|0)}else{m=0}h=m&1;if(((((cG(a,g)|0)==(a|0)^1)&1|0)!=0|0)!=0){bh(576,841,864);return 0}c[k>>2]=0;m=a<<5;n=cs(k,g+1<<2)|0;o=cs(k,2<<g<<2)|0;p=0;while(1){if((p|0)>(g|0)){break}c[n+(p<<2)>>2]=o;o=o+(1<<p<<2)|0;p=p+1|0}cI(n,g);p=1<<g;o=m>>g;m=((o-1|0)/32|0)+1|0;q=cJ(32,g)|0;r=_((((o<<1)+g+2|0)/(q|0)|0)+1|0,q)|0;q=(r|0)/32|0;if((q|0)>=(((h|0)!=0?360:300)|0)){while(1){o=1<<(cF(q,h)|0);if((q&o-1|0)==0){break}q=q+o-1&-o;r=q<<5}}if(((((q|0)<(a|0)^1)&1|0)!=0|0)!=0){bh(576,879,416);return 0}o=cs(k,q+1<<1<<2)|0;s=r>>g;r=cs(k,(_(p,q+1|0)|0)<<2)|0;t=cs(k,p<<2)|0;cK(r,t,p,q,b,d,m,s,o);if((h|0)!=0){u=cs(k,(_(m,p-1|0)|0)+q+1<<2)|0;v=cs(k,p<<2)|0}else{u=cs(k,(_(p,q+1|0)|0)<<2)|0;v=cs(k,p<<2)|0;cK(u,v,p,q,e,f,m,s,o)}f=cL(l,a,g,t,v,r,u,q,m,s,n,o,h)|0;if((((c[k>>2]|0)!=0|0)!=0|0)!=0){ct(c[k>>2]|0)}i=j;return f|0}function cI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;c[c[d>>2]>>2]=0;b=1;e=1;while(1){if((b|0)>(a|0)){break}f=c[d+(b<<2)>>2]|0;g=0;while(1){if((g|0)>=(e|0)){break}c[f+(g<<2)>>2]=c[(c[d+(b-1<<2)>>2]|0)+(g<<2)>>2]<<1;c[f+(e+g<<2)>>2]=(c[f+(g<<2)>>2]|0)+1;g=g+1|0}b=b+1|0;e=e<<1}return}function cJ(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;b=a;while(1){if(((c>>>0)%2|0|0)==0){d=(a|0)>0}else{d=0}if(!d){break}c=c>>>1;a=a-1|0}return c<<b|0}function cK(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;l=i;i=i+8|0;m=l|0;n=a;a=b;b=d;d=e;e=f;f=g;g=h;h=j;j=k;k=_(b,g)|0;c[m>>2]=0;if((f|0)>(k|0)){o=f-k|0;p=cs(m,k+1<<2)|0;if((o|0)>(k|0)){q=0;r=bX(p,e,e+(k<<2)|0,k)|0;e=e+(k<<1<<2)|0;o=o-k|0;while(1){if((o|0)<=(k|0)){break}if((q|0)!=0){r=r+(bX(p,p,e,k)|0)|0}else{r=r-(bo(p,p,e,k)|0)|0}q=q^1;e=e+(k<<2)|0;o=o-k|0}if((q|0)!=0){r=r+(a6(p,p,k,e,o)|0)|0}else{r=r-(a5(p,p,k,e,o)|0)|0}if((r|0)>=0){r=bn(p,p,k,r)|0}else{r=bW(p,p,k,-r|0)|0}}else{r=a6(p,e,k,e+(k<<2)|0,o)|0;r=bn(p,p,k,r)|0}c[p+(k<<2)>>2]=r;f=k+1|0;e=p}p=0;while(1){if((p|0)>=(b|0)){break}c[a+(p<<2)>>2]=n;if((f|0)>0){do{if((g|0)<=(f|0)){if((p|0)>=(b-1|0)){s=4576;break}t=g}else{s=4576}}while(0);if((s|0)==4576){s=0;t=f}k=t;f=f-k|0;if((k|0)!=0){r=k-1|0;o=j;q=e;u=q;q=u+4|0;v=c[u>>2]|0;if((r|0)!=0){do{u=o;o=u+4|0;c[u>>2]=v;u=q;q=u+4|0;v=c[u>>2]|0;u=r-1|0;r=u;}while((u|0)!=0)}r=o;o=r+4|0;c[r>>2]=v}if((d+1-k|0)!=0){r=j+(k<<2)|0;q=d+1-k|0;do{u=r;r=u+4|0;c[u>>2]=0;u=q-1|0;q=u;}while((u|0)!=0)}e=e+(g<<2)|0;cR(n,j,_(p,h)|0,d)}else{if((d+1|0)!=0){q=n;r=d+1|0;do{k=q;q=k+4|0;c[k>>2]=0;k=r-1|0;r=k;}while((k|0)!=0)}}n=n+(d+1<<2)|0;p=p+1|0}if(((((f|0)==0^1)&1|0)!=0|0)!=0){bh(576,715,184)}if((((c[m>>2]|0)!=0|0)!=0|0)!=0){ct(c[m>>2]|0)}i=l;return}function cL(a,b,d,e,f,g,h,i,j,k,l,m,n){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=b;b=d;d=e;e=f;f=h;h=i;i=j;j=k;k=l;l=m;m=n;n=1<<b;cM(d,n,k+(b<<2)|0,j<<1,h,1,l);if((m|0)==0){cM(e,n,k+(b<<2)|0,j<<1,h,1,l)}if((m|0)!=0){o=d}else{o=e}cN(d,o,h,n);cO(d,n,j<<1,h,l);c[e>>2]=l+(h<<2)+4;cP(c[e>>2]|0,c[d>>2]|0,b,h);o=1;while(1){if((o|0)>=(n|0)){break}c[e+(o<<2)>>2]=c[d+(o-1<<2)>>2];m=c[e+(o<<2)>>2]|0;k=c[d+(o<<2)>>2]|0;cP(m,k,b+(_(n-o|0,j)|0)|0,h);o=o+1|0}if((h+1|0)!=0){j=l;b=h+1|0;do{d=j;j=d+4|0;c[d>>2]=0;d=b-1|0;b=d;}while((d|0)!=0)}b=(_(i,n-1|0)|0)+h+1|0;j=f;if((b|0)!=0){f=j;d=b;do{k=f;f=k+4|0;c[k>>2]=0;k=d-1|0;d=k;}while((k|0)!=0)}d=0;o=n-1|0;f=(_(i,o)|0)+h|0;k=_(i,o)|0;while(1){if((o|0)<0){break}m=j+(k<<2)|0;p=n-o&n-1;if((bo(m,m,c[e+(p<<2)>>2]|0,h+1|0)|0)!=0){d=d+(bn(m+(h<<2)+4|0,m+(h<<2)+4|0,b-k-h-1|0,1)|0)|0}c[l+(i<<1<<2)>>2]=o+1;if((be(c[e+(p<<2)>>2]|0,l,h+1|0)|0)>0){d=d-(bW(m,m,b-k|0,1)|0)|0;d=d-(bW(j+(f<<2)|0,j+(f<<2)|0,b-f|0,1)|0)|0}o=o-1|0;f=f-i|0;k=k-i|0}if((d|0)==-1){i=bn(j+(b<<2)+(-a<<2)|0,j+(b<<2)+(-a<<2)|0,a,1)|0;d=i;if((i|0)!=0){i=j+(b<<2)+(-a<<2)-4|0;k=j+(b<<2)+(-a<<2)-4|0;f=a+1|0;bW(i,k,f,1)|0;f=j+(b<<2)-4|0;k=j+(b<<2)-4|0;bW(f,k,1,1)|0}q=g;r=a;s=j;t=b;u=cQ(q,r,s,t)|0;return u|0}if((d|0)==1){if((b|0)>=(a<<1|0)){do{k=bn(j+(b<<2)+(-(a<<1)<<2)|0,j+(b<<2)+(-(a<<1)<<2)|0,a<<1,d)|0;d=k;}while((k|0)!=0)}else{d=bW(j+(b<<2)+(-a<<2)|0,j+(b<<2)+(-a<<2)|0,a,d)|0}}q=g;r=a;s=j;t=b;u=cQ(q,r,s,t)|0;return u|0}function cM(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;if((a|0)!=2){h=a>>1;a=c[b>>2]|0;cM(i,h,b-4|0,d<<1,e,f<<1,g);cM(i+(f<<2)|0,h,b-4|0,d<<1,e,f<<1,g);b=0;while(1){if((b|0)>=(h|0)){break}j=c[i+(f<<2)>>2]|0;cR(g,j,_(c[a>>2]|0,d)|0,e);cT(c[i+(f<<2)>>2]|0,c[i>>2]|0,g,e);cU(c[i>>2]|0,c[i>>2]|0,g,e);b=b+1|0;a=a+8|0;i=i+(f<<1<<2)|0}return}if((e+1|0)!=0){a=e+1-1|0;b=g;d=c[i>>2]|0;h=d;d=h+4|0;j=c[h>>2]|0;if((a|0)!=0){do{h=b;b=h+4|0;c[h>>2]=j;h=d;d=h+4|0;j=c[h>>2]|0;h=a-1|0;a=h;}while((h|0)!=0)}a=b;b=a+4|0;c[a>>2]=j}bo(c[i>>2]|0,c[i>>2]|0,c[i+(f<<2)>>2]|0,e+1|0)|0;j=bX(c[i+(f<<2)>>2]|0,g,c[i+(f<<2)>>2]|0,e+1|0)|0;if((c[(c[i>>2]|0)+(e<<2)>>2]|0)>>>0>1){g=1-(bW(c[i>>2]|0,c[i>>2]|0,e,(c[(c[i>>2]|0)+(e<<2)>>2]|0)-1|0)|0)|0;c[(c[i>>2]|0)+(e<<2)>>2]=g}if((j|0)!=0){j=bn(c[i+(f<<2)>>2]|0,c[i+(f<<2)>>2]|0,e,~c[(c[i+(f<<2)>>2]|0)+(e<<2)>>2]+1|0)|0;c[(c[i+(f<<2)>>2]|0)+(e<<2)>>2]=j}return}function cN(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;e=(h|0)==(a|0)|0;c[g>>2]=0;if((b|0)>=(((e|0)!=0?360:300)|0)){j=cF(b,e)|0;k=1<<j;if(((((b&k-1|0)==0^1)&1|0)!=0|0)!=0){bh(576,449,256)}if((k|0)>32){l=k}else{l=32}m=l;l=b>>j;n=_(((b<<5>>j<<1)+j+2+m|0)/(m|0)|0,m)|0;m=(n|0)/32|0;if((m|0)>=(((e|0)!=0?360:300)|0)){while(1){o=1<<(cF(m,e)|0);if((m&o-1|0)==0){break}m=m+o-1&-o;n=m<<5}}if(((((m|0)<(b|0)^1)&1|0)!=0|0)!=0){bh(576,471,240)}o=n>>j;n=cs(g,k<<2)|0;p=cs(g,k<<2)|0;q=cs(g,m+1<<1<<j<<2)|0;r=cs(g,m+1<<1<<2)|0;s=q+(m+1<<j<<2)|0;t=cs(g,j+1<<2)|0;u=cs(g,2<<j<<2)|0;v=0;while(1){if((v|0)>(j|0)){break}c[t+(v<<2)>>2]=u;u=u+(1<<v<<2)|0;v=v+1|0}cI(t,j);v=0;while(1){if((v|0)>=(d|0)){break}cS(c[h>>2]|0,b);if((e|0)==0){cS(c[a>>2]|0,b)}cK(q,n,k,m,c[h>>2]|0,(l<<j)+1|0,l,o,r);if((e|0)==0){cK(s,p,k,m,c[a>>2]|0,(l<<j)+1|0,l,o,r)}u=cL(c[h>>2]|0,b,j,n,p,q,s,m,l,o,t,r,e)|0;c[(c[h>>2]|0)+(b<<2)>>2]=u;v=v+1|0;h=h+4|0;a=a+4|0}}else{r=b<<1;t=cs(g,r<<2)|0;o=t+(b<<2)|0;v=0;while(1){if((v|0)>=(d|0)){break}l=h;h=l+4|0;m=c[l>>2]|0;l=a;a=l+4|0;s=c[l>>2]|0;if((e|0)!=0){bP(t,m,b)}else{bD(t,s,m,b)}if((c[m+(b<<2)>>2]|0)!=0){w=bo(o,o,s,b)|0}else{w=0}if((c[s+(b<<2)>>2]|0)!=0){s=bo(o,o,m,b)|0;w=w+(s+(c[m+(b<<2)>>2]|0))|0}if((w|0)!=0){w=bn(t,t,r,w)|0}if((bX(m,t,o,b)|0)!=0){x=(bn(m,m,b,1)|0)!=0}else{x=0}c[m+(b<<2)>>2]=x&1;v=v+1|0}}if((((c[g>>2]|0)!=0|0)!=0|0)!=0){ct(c[g>>2]|0)}i=f;return}function cO(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=a;a=b;b=d;d=e;e=f;if((a|0)!=2){f=a>>1;cO(g,f,b<<1,d,e);cO(g+(f<<2)|0,f,b<<1,d,e);a=0;while(1){if((a|0)>=(f|0)){break}h=c[g+(f<<2)>>2]|0;cR(e,h,_(a,b)|0,d);cT(c[g+(f<<2)>>2]|0,c[g>>2]|0,e,d);cU(c[g>>2]|0,c[g>>2]|0,e,d);a=a+1|0;g=g+4|0}return}if((d+1|0)!=0){a=d+1-1|0;f=e;b=c[g>>2]|0;h=b;b=h+4|0;i=c[h>>2]|0;if((a|0)!=0){do{h=f;f=h+4|0;c[h>>2]=i;h=b;b=h+4|0;i=c[h>>2]|0;h=a-1|0;a=h;}while((h|0)!=0)}a=f;f=a+4|0;c[a>>2]=i}bo(c[g>>2]|0,c[g>>2]|0,c[g+4>>2]|0,d+1|0)|0;i=bX(c[g+4>>2]|0,e,c[g+4>>2]|0,d+1|0)|0;if((c[(c[g>>2]|0)+(d<<2)>>2]|0)>>>0>1){e=1-(bW(c[g>>2]|0,c[g>>2]|0,d,(c[(c[g>>2]|0)+(d<<2)>>2]|0)-1|0)|0)|0;c[(c[g>>2]|0)+(d<<2)>>2]=e}if((i|0)!=0){i=bn(c[g+4>>2]|0,c[g+4>>2]|0,d,~c[(c[g+4>>2]|0)+(d<<2)>>2]+1|0)|0;c[(c[g+4>>2]|0)+(d<<2)>>2]=i}return}function cP(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a;a=d;cR(e,b,(a<<1<<5)-c|0,a);cS(e,a);return}function cQ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=a;a=b;b=d;d=e;e=d-(a<<1)|0;if((e|0)>0){g=a;h=bo(f,b,b+(a<<1<<2)|0,e)|0;i=bn(f+(e<<2)|0,b+(e<<2)|0,a-e|0,h)|0}else{g=d-a|0;if((a|0)!=0){d=a-1|0;e=f;j=b;k=j;j=k+4|0;l=c[k>>2]|0;if((d|0)!=0){do{k=e;e=k+4|0;c[k>>2]=l;k=j;j=k+4|0;l=c[k>>2]|0;k=d-1|0;d=k;}while((k|0)!=0)}d=e;e=d+4|0;c[d>>2]=l}i=0}h=bX(f,f,b+(a<<2)|0,g)|0;i=i-(bW(f+(g<<2)|0,f+(g<<2)|0,a-g|0,h)|0)|0;if((i|0)>=0){m=i;return m|0}i=bn(f,f,a,1)|0;m=i;return m|0}function cR(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a;a=b;b=d;d=e;e=(b>>>0)%32|0;g=(b>>>0)/32|0;if((g|0)<(d|0)){if((e|0)!=0){b=f;h=a+(d<<2)+(-g<<2)|0;i=g+1|0;j=e;c4(b,h,i,j)|0;k=~c[f+(g<<2)>>2];l=bu(f+(g<<2)|0,a,d-g|0,e)|0}else{j=f;i=a+(d<<2)+(-g<<2)|0;h=g+1|0;do{b=i;i=b+4|0;m=j;j=m+4|0;c[m>>2]=~c[b>>2];b=h-1|0;h=b;}while((b|0)!=0);k=c[a+(d<<2)>>2]|0;if((d-g|0)!=0){h=d-g-1|0;j=f+(g<<2)|0;i=a;b=i;i=b+4|0;m=c[b>>2]|0;if((h|0)!=0){do{b=j;j=b+4|0;c[b>>2]=m;b=i;i=b+4|0;m=c[b>>2]|0;b=h-1|0;h=b;}while((b|0)!=0)}h=j;j=h+4|0;c[h>>2]=m}l=0}if((g|0)!=0){m=l;l=m-1|0;if((m|0)==0){l=bn(f,f,d,1)|0}l=(bW(f,f,g,l)|0)+1|0}c[f+(d<<2)>>2]=-(bW(f+(g<<2)|0,f+(g<<2)|0,d-g|0,l)|0);m=bW(f+(g<<2)|0,f+(g<<2)|0,d-g|0,k)|0;h=f+(d<<2)|0;c[h>>2]=(c[h>>2]|0)-m;if((c[f+(d<<2)>>2]&-2147483648|0)!=0){c[f+(d<<2)>>2]=bn(f,f,d,1)|0}return}g=g-d|0;if((e|0)!=0){m=f;h=a+(d<<2)+(-g<<2)|0;j=g+1|0;i=e;bu(m,h,j,i)|0;k=c[f+(g<<2)>>2]|0;l=c4(f+(g<<2)|0,a,d-g|0,e)|0}else{if((g|0)!=0){e=g-1|0;i=f;j=a+(d<<2)+(-g<<2)|0;h=j;j=h+4|0;m=c[h>>2]|0;if((e|0)!=0){do{h=i;i=h+4|0;c[h>>2]=m;h=j;j=h+4|0;m=c[h>>2]|0;h=e-1|0;e=h;}while((h|0)!=0)}e=i;i=e+4|0;c[e>>2]=m}k=c[a+(d<<2)>>2]|0;m=f+(g<<2)|0;e=a;a=d-g|0;do{i=e;e=i+4|0;j=m;m=j+4|0;c[j>>2]=~c[i>>2];i=a-1|0;a=i;}while((i|0)!=0);l=0}c[f+(d<<2)>>2]=0;l=l+1|0;d=f;a=(c[d>>2]|0)+l|0;c[d>>2]=a;if(a>>>0<l>>>0){do{a=d+4|0;d=a;m=(c[a>>2]|0)+1|0;c[a>>2]=m;}while((m|0)==0)}k=k+1|0;if((k|0)==0){n=1}else{n=k}l=n;f=f+(g<<2)+(((k|0)==0)<<2)|0;k=f;f=(c[k>>2]|0)+l|0;c[k>>2]=f;if(f>>>0<l>>>0){do{l=k+4|0;k=l;f=(c[l>>2]|0)+1|0;c[l>>2]=f;}while((f|0)==0)}return}function cS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;if((c[d+(a<<2)>>2]|0)==0){return}b=d;do{e=b;b=e+4|0;f=c[e>>2]|0;c[e>>2]=f-1;}while((f|0)==0);if((c[d+(a<<2)>>2]|0)==0){if((a|0)!=0){b=d;f=a;do{e=b;b=e+4|0;c[e>>2]=0;e=f-1|0;f=e;}while((e|0)!=0)}c[d+(a<<2)>>2]=1}else{c[d+(a<<2)>>2]=0}return}function cT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=a;a=b;b=d;d=e;e=(c[a+(d<<2)>>2]|0)-(c[b+(d<<2)>>2]|0)|0;g=e-(bX(f,a,b,d)|0)|0;b=-g&-((g&-2147483648|0)!=0|0);c[f+(d<<2)>>2]=b+g;g=f;f=(c[g>>2]|0)+b|0;c[g>>2]=f;if(f>>>0<b>>>0){do{b=g+4|0;g=b;f=(c[b>>2]|0)+1|0;c[b>>2]=f;}while((f|0)==0)}return}function cU(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=a;a=b;b=d;d=e;e=(c[a+(d<<2)>>2]|0)+(c[b+(d<<2)>>2]|0)|0;g=e+(bo(f,a,b,d)|0)|0;b=g-1&-((g|0)!=0|0);c[f+(d<<2)>>2]=g-b;g=f;f=c[g>>2]|0;c[g>>2]=f-b;if(f>>>0<b>>>0){do{b=g+4|0;g=b;f=c[b>>2]|0;c[b>>2]=f-1;}while((f|0)==0)}return}function cV(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=a;a=b;b=d;d=e;e=f;f=g;a=a+(b<<2)|0;g=b-e|0;if((g+1|0)<(e|0)){d=d+(e-(g+1)<<2)|0;e=g+1|0}b=(be(a+(-e<<2)|0,d,e)|0)>=0|0;if((b|0)!=0){i=a+(-e<<2)|0;j=a+(-e<<2)|0;k=d;l=e;bX(i,j,k,l)|0}h=h+(g<<2)|0;e=e-2|0;l=c[d+(e+1<<2)>>2]|0;k=c[d+(e<<2)>>2]|0;a=a-8|0;j=c[a+4>>2]|0;i=g-(e+2)|0;while(1){if((i|0)<0){break}a=a-4|0;do{if((((j|0)==(l|0)|0)!=0|0)!=0){if((c[a+4>>2]|0)!=(k|0)){m=4968;break}n=-1;g=a+(-e<<2)|0;o=d;p=e+2|0;q=n;bY(g,o,p,q)|0;j=c[a+4>>2]|0}else{m=4968}}while(0);if((m|0)==4968){m=0;q=j;p=f;o=q&65535;g=q>>>16;q=p&65535;r=p>>>16;p=_(o,q)|0;s=_(o,r)|0;o=_(g,q)|0;q=_(g,r)|0;s=s+(p>>>16)|0;s=s+o|0;if(s>>>0<o>>>0){q=q+65536|0}n=q+(s>>>16)|0;q=(s<<16)+(p&65535)|0;p=q+(c[a+4>>2]|0)|0;n=n+j+(p>>>0<q>>>0)|0;q=p;p=c[a+4>>2]|0;j=p-(_(l,n)|0)|0;j=j-l-((c[a>>2]|0)>>>0<k>>>0)|0;t=(c[a>>2]|0)-k|0;p=k;s=n;o=p&65535;r=p>>>16;p=s&65535;g=s>>>16;s=_(o,p)|0;u=_(o,g)|0;o=_(r,p)|0;p=_(r,g)|0;u=u+(s>>>16)|0;u=u+o|0;if(u>>>0<o>>>0){p=p+65536|0}o=(u<<16)+(s&65535)|0;j=j-(p+(u>>>16))-(t>>>0<o>>>0)|0;t=t-o|0;n=n+1|0;o=-(j>>>0>=q>>>0|0)|0;n=n+o|0;q=t+(o&k)|0;j=j+(o&l)+(q>>>0<t>>>0)|0;t=q;if(((j>>>0>=l>>>0|0)!=0|0)!=0){if(j>>>0>l>>>0){m=4988}else{if(t>>>0>=k>>>0){m=4988}}if((m|0)==4988){m=0;n=n+1|0;j=j-l-(t>>>0<k>>>0)|0;t=t-k|0}}v=bY(a+(-e<<2)|0,d,e,n)|0;w=t>>>0<v>>>0|0;t=t-v|0;v=j>>>0<w>>>0|0;j=j-w|0;c[a>>2]=t;if((((v|0)!=0|0)!=0|0)!=0){j=j+(l+(bo(a+(-e<<2)|0,a+(-e<<2)|0,d,e+1|0)|0))|0;n=n-1|0}}q=h-4|0;h=q;c[q>>2]=n;i=i-1|0}q=-1;if((e|0)>=0){i=e;while(1){if((i|0)<=0){break}a=a-4|0;if(((j>>>0>=(l&q)>>>0|0)!=0|0)!=0){n=-1;v=bY(a+(-e<<2)|0,d,e+2|0,n)|0;if((((j|0)!=(v|0)|0)!=0|0)!=0){if(j>>>0<(v&q)>>>0){n=n-1|0;o=a+(-e<<2)|0;u=a+(-e<<2)|0;p=d;s=e+2|0;bo(o,u,p,s)|0}else{q=0}}j=c[a+4>>2]|0}else{s=j;p=f;u=s&65535;o=s>>>16;s=p&65535;g=p>>>16;p=_(u,s)|0;r=_(u,g)|0;u=_(o,s)|0;s=_(o,g)|0;r=r+(p>>>16)|0;r=r+u|0;if(r>>>0<u>>>0){s=s+65536|0}n=s+(r>>>16)|0;s=(r<<16)+(p&65535)|0;p=s+(c[a+4>>2]|0)|0;n=n+j+(p>>>0<s>>>0)|0;s=p;p=c[a+4>>2]|0;j=p-(_(l,n)|0)|0;j=j-l-((c[a>>2]|0)>>>0<k>>>0)|0;t=(c[a>>2]|0)-k|0;p=k;r=n;u=p&65535;g=p>>>16;p=r&65535;o=r>>>16;r=_(u,p)|0;x=_(u,o)|0;u=_(g,p)|0;p=_(g,o)|0;x=x+(r>>>16)|0;x=x+u|0;if(x>>>0<u>>>0){p=p+65536|0}u=(x<<16)+(r&65535)|0;j=j-(p+(x>>>16))-(t>>>0<u>>>0)|0;t=t-u|0;n=n+1|0;u=-(j>>>0>=s>>>0|0)|0;n=n+u|0;s=t+(u&k)|0;j=j+(u&l)+(s>>>0<t>>>0)|0;t=s;if(((j>>>0>=l>>>0|0)!=0|0)!=0){if(j>>>0>l>>>0){m=5028}else{if(t>>>0>=k>>>0){m=5028}}if((m|0)==5028){m=0;n=n+1|0;j=j-l-(t>>>0<k>>>0)|0;t=t-k|0}}v=bY(a+(-e<<2)|0,d,e,n)|0;w=t>>>0<v>>>0|0;t=t-v|0;v=j>>>0<w>>>0|0;j=j-w|0;c[a>>2]=t;if((((v|0)!=0|0)!=0|0)!=0){j=j+(l+(bo(a+(-e<<2)|0,a+(-e<<2)|0,d,e+1|0)|0))|0;n=n-1|0}}s=h-4|0;h=s;c[s>>2]=n;e=e-1|0;d=d+4|0;i=i-1|0}a=a-4|0;if(((j>>>0>=(l&q)>>>0|0)!=0|0)!=0){n=-1;v=bY(a,d,2,n)|0;if((((j|0)!=(v|0)|0)!=0|0)!=0){if(j>>>0<(v&q)>>>0){n=n-1|0;v=(c[a>>2]|0)+(c[d>>2]|0)|0;c[a+4>>2]=(c[a+4>>2]|0)+(c[d+4>>2]|0)+(v>>>0<(c[a>>2]|0)>>>0);c[a>>2]=v}else{q=0}}j=c[a+4>>2]|0}else{q=j;v=f;f=q&65535;d=q>>>16;q=v&65535;i=v>>>16;v=_(f,q)|0;e=_(f,i)|0;f=_(d,q)|0;q=_(d,i)|0;e=e+(v>>>16)|0;e=e+f|0;if(e>>>0<f>>>0){q=q+65536|0}n=q+(e>>>16)|0;q=(e<<16)+(v&65535)|0;v=q+(c[a+4>>2]|0)|0;n=n+j+(v>>>0<q>>>0)|0;q=v;v=c[a+4>>2]|0;j=v-(_(l,n)|0)|0;j=j-l-((c[a>>2]|0)>>>0<k>>>0)|0;t=(c[a>>2]|0)-k|0;v=k;e=n;f=v&65535;i=v>>>16;v=e&65535;d=e>>>16;e=_(f,v)|0;w=_(f,d)|0;f=_(i,v)|0;v=_(i,d)|0;w=w+(e>>>16)|0;w=w+f|0;if(w>>>0<f>>>0){v=v+65536|0}f=(w<<16)+(e&65535)|0;j=j-(v+(w>>>16))-(t>>>0<f>>>0)|0;t=t-f|0;n=n+1|0;f=-(j>>>0>=q>>>0|0)|0;n=n+f|0;q=t+(f&k)|0;j=j+(f&l)+(q>>>0<t>>>0)|0;t=q;if(((j>>>0>=l>>>0|0)!=0|0)!=0){if(j>>>0>l>>>0){m=5067}else{if(t>>>0>=k>>>0){m=5067}}if((m|0)==5067){n=n+1|0;j=j-l-(t>>>0<k>>>0)|0;t=t-k|0}}c[a+4>>2]=j;c[a>>2]=t}t=h-4|0;h=t;c[t>>2]=n}if(((((c[a+4>>2]|0)==(j|0)^1)&1|0)!=0|0)!=0){bh(520,196,848);return 0}return b|0}function cW(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=i;j=a;a=b;b=d;d=e;e=f;f=g;if((b|0)>=(e<<1|0)){k=b+3>>2}else{k=e+1>>1}g=k;k=b-(g*3|0)|0;b=e-g|0;e=0;l=i;i=i+(g+1<<2)|0;i=i+7&-8;m=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;n=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;o=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;p=l;l=i;i=i+(g<<2)|0;i=i+7&-8;q=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;r=l;l=(ce(m,n,a,g,k,j)|0)&1;s=bu(o,a+((g*3|0)<<2)|0,k,1)|0;s=s+(bo(o,a+(g<<1<<2)|0,o,k)|0)|0;if((k|0)!=(g|0)){s=bn(o+(k<<2)|0,a+(g<<1<<2)+(k<<2)|0,g-k|0,s)|0}s=(s<<1)+(bu(o,o,g,1)|0)|0;s=s+(bo(o,a+(g<<2)|0,o,g)|0)|0;s=(s<<1)+(bu(o,o,g,1)|0)|0;s=s+(bo(o,a,o,g)|0)|0;c[o+(g<<2)>>2]=s;if((b|0)==(g|0)){c[p+(g<<2)>>2]=bo(p,d,d+(g<<2)|0,g)|0;if((be(d,d+(g<<2)|0,g)|0)<0){t=q;u=d+(g<<2)|0;v=d;w=g;bX(t,u,v,w)|0;l=l^1}else{w=q;v=d;u=d+(g<<2)|0;t=g;bX(w,v,u,t)|0}}else{c[p+(g<<2)>>2]=a5(p,d,g,d+(g<<2)|0,b)|0;do{if((cX(d+(b<<2)|0,g-b|0)|0)!=0){if((be(d,d+(g<<2)|0,b)|0)>=0){x=5105;break}t=q;u=d+(g<<2)|0;v=d;w=b;bX(t,u,v,w)|0;if((g-b|0)!=0){w=q+(b<<2)|0;v=g-b|0;do{u=w;w=u+4|0;c[u>>2]=0;u=v-1|0;v=u;}while((u|0)!=0)}l=l^1}else{x=5105}}while(0);if((x|0)==5105){x=q;v=d;w=g;u=d+(g<<2)|0;t=b;a6(x,v,w,u,t)|0}}a5(r,p,g+1|0,d+(g<<2)|0,b)|0;bD(f,n,q,g);s=0;if((c[n+(g<<2)>>2]|0)!=0){s=bo(f+(g<<2)|0,f+(g<<2)|0,q,g)|0}c[f+(g<<1<<2)>>2]=s;bD(f+(g<<1<<2)+4|0,o,r,g+1|0);if((k|0)>(b|0)){r=j+(g<<2<<2)|0;o=a+((g*3|0)<<2)|0;q=k;n=d+(g<<2)|0;t=b;cu(r,o,q,n,t)|0}else{t=j+(g<<2<<2)|0;n=d+(g<<2)|0;q=b;o=a+((g*3|0)<<2)|0;r=k;cu(t,n,q,o,r)|0}r=c[j+(g<<2<<2)>>2]|0;bD(j+(g<<1<<2)|0,m,p,g);if((c[m+(g<<2)>>2]|0)==1){o=c[p+(g<<2)>>2]|0;s=o+(bo(j+(g<<1<<2)+(g<<2)|0,j+(g<<1<<2)+(g<<2)|0,p,g)|0)|0}else{if((c[m+(g<<2)>>2]|0)==2){o=c[p+(g<<2)>>2]<<1;s=o+(cx(j+(g<<1<<2)+(g<<2)|0,p,g,2)|0)|0}else{if((c[m+(g<<2)>>2]|0)==3){o=(c[p+(g<<2)>>2]|0)*3|0;s=o+(cx(j+(g<<1<<2)+(g<<2)|0,p,g,3)|0)|0}else{s=0}}}if((c[p+(g<<2)>>2]|0)!=0){s=s+(bo(j+(g<<1<<2)+(g<<2)|0,j+(g<<1<<2)+(g<<2)|0,m,g)|0)|0}c[j+(g<<1<<2)+(g<<1<<2)>>2]=s;bD(j,a,d,g);cp(j,f+(g<<1<<2)+4|0,f,g,k+b|0,l,r);if((((e|0)!=0|0)!=0|0)!=0){ct(e)}i=h;return}function cX(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;while(1){b=a-1|0;a=b;if((b|0)<0){e=5151;break}if((c[d+(a<<2)>>2]|0)!=0){e=5149;break}}if((e|0)==5149){f=0;g=f;return g|0}else if((e|0)==5151){f=1;g=f;return g|0}return 0}function cY(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;h=a;a=b;b=d;d=e;e=f;f=g;if((b*3|0|0)>=(e<<2|0)){i=b-1>>2}else{i=((e-1|0)>>>0)/3|0}g=i+1|0;i=b-(g*3|0)|0;b=e-(g<<1)|0;e=2&(cf(h+((g*3|0)<<2)+12|0,f+(g<<2<<2)+16|0,a,g,i,f+((g*3|0)<<2)+12|0)|0);c[f+(g<<1<<2)+8+(g<<2)>>2]=bu(f+(g<<1<<2)+8|0,d+(g<<2)|0,g,1)|0;j=bu(f,d+(g<<1<<2)|0,b,2)|0;j=j+(bo(f,f,d,b)|0)|0;if((b|0)!=(g|0)){j=bn(f+(b<<2)|0,d+(b<<2)|0,g-b|0,j)|0}c[f+(g<<2)>>2]=j;bo(h+(g<<1<<2)+8|0,f,f+(g<<1<<2)+8|0,g+1|0)|0;if((be(f,f+(g<<1<<2)+8|0,g+1|0)|0)<0){j=h+(g<<2)+4|0;k=f+(g<<1<<2)+8|0;l=f;m=g+1|0;bX(j,k,l,m)|0;e=e^2}else{m=h+(g<<2)+4|0;l=f;k=f+(g<<1<<2)+8|0;j=g+1|0;bX(m,l,k,j)|0}e=e^1&(ce(h+(g<<2<<2)+16|0,f+((g*3|0)<<2)+12|0,a,g,i,f)|0);c[f+(g<<1<<2)+8+(g<<2)>>2]=a5(f+(g<<1<<2)+8|0,d,g,d+(g<<1<<2)|0,b)|0;j=c[f+(g<<1<<2)+8+(g<<2)>>2]|0;c[h+(g<<2)>>2]=j+(bo(h,f+(g<<1<<2)+8|0,d+(g<<2)|0,g)|0);do{if((c[f+(g<<1<<2)+8+(g<<2)>>2]|0)==0){if((be(f+(g<<1<<2)+8|0,d+(g<<2)|0,g)|0)>=0){n=5172;break}j=f+(g<<1<<2)+8|0;k=d+(g<<2)|0;l=f+(g<<1<<2)+8|0;m=g;bX(j,k,l,m)|0;e=e^1}else{n=5172}}while(0);if((n|0)==5172){n=bX(f+(g<<1<<2)+8|0,f+(g<<1<<2)+8|0,d+(g<<2)|0,g)|0;m=f+(g<<1<<2)+8+(g<<2)|0;c[m>>2]=(c[m>>2]|0)-n}bD(f,f+((g*3|0)<<2)+12|0,f+(g<<1<<2)+8|0,g+1|0);bD(f+(g<<1<<2)+4|0,f+(g<<2<<2)+16|0,h+(g<<2)+4|0,g+1|0);bD(f+(g<<2<<2)+8|0,h+((g*3|0)<<2)+12|0,h+(g<<1<<2)+8|0,g+1|0);bD(h+(g<<1<<2)|0,h+(g<<2<<2)+16|0,h,g+1|0);if((i|0)>(b|0)){n=h+((g*5|0)<<2)|0;m=a+((g*3|0)<<2)|0;l=i;k=d+(g<<1<<2)|0;j=b;cu(n,m,l,k,j)|0;o=h;p=a;q=d;r=g;bD(o,p,q,r);s=h;t=g;u=e;v=f;w=f;x=g;y=x<<1;z=w+(y<<2)|0;A=z+4|0;B=f;C=g;D=C<<2;E=B+(D<<2)|0;F=E+8|0;G=b;H=i;I=G+H|0;c1(s,t,u,v,A,F,I);return}else{j=h+((g*5|0)<<2)|0;k=d+(g<<1<<2)|0;l=b;m=a+((g*3|0)<<2)|0;n=i;cu(j,k,l,m,n)|0;o=h;p=a;q=d;r=g;bD(o,p,q,r);s=h;t=g;u=e;v=f;w=f;x=g;y=x<<1;z=w+(y<<2)|0;A=z+4|0;B=f;C=g;D=C<<2;E=B+(D<<2)|0;F=E+8|0;G=b;H=i;I=G+H|0;c1(s,t,u,v,A,F,I);return}}function cZ(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;h=i;j=a;a=b;b=d;d=e;e=f;f=g;if((b*3|0|0)>=(e*5|0|0)){k=((b-1|0)>>>0)/5|0}else{k=((e-1|0)>>>0)/3|0}g=k+1|0;k=b-(g<<2)|0;b=e-(g<<1)|0;e=0;l=i;i=i+(g+1<<2)|0;i=i+7&-8;m=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;n=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;o=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;p=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;q=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;r=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;s=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;t=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;u=l;l=i;i=i+(g+1<<2)|0;i=i+7&-8;v=l;l=j;w=2&(cg(m,n,4,a,g,k,l)|0);w=w|1&(ch(o,p,4,a,g,k,l)|0);x=bu(q,a,g,1)|0;x=x+(bo(q,q,a+(g<<2)|0,g)|0)|0;x=(x<<1)+(bu(q,q,g,1)|0)|0;x=x+(bo(q,q,a+(g<<1<<2)|0,g)|0)|0;x=(x<<1)+(bu(q,q,g,1)|0)|0;x=x+(bo(q,q,a+((g*3|0)<<2)|0,g)|0)|0;x=(x<<1)+(bu(q,q,g,1)|0)|0;c[q+(g<<2)>>2]=x+(a5(q,q,g,a+(g<<2<<2)|0,k)|0);c[r+(g<<2)>>2]=a5(r,d,g,d+(g<<1<<2)|0,b)|0;do{if((c[r+(g<<2)>>2]|0)==0){if((be(r,d+(g<<2)|0,g)|0)>=0){y=5205;break}z=s;A=d+(g<<2)|0;B=r;C=g;bX(z,A,B,C)|0;c[s+(g<<2)>>2]=0;w=w^2}else{y=5205}}while(0);if((y|0)==5205){y=c[r+(g<<2)>>2]|0;c[s+(g<<2)>>2]=y-(bX(s,r,d+(g<<2)|0,g)|0)}y=bo(r,r,d+(g<<2)|0,g)|0;C=r+(g<<2)|0;c[C>>2]=(c[C>>2]|0)+y;x=bu(l,d+(g<<1<<2)|0,b,2)|0;c[t+(g<<2)>>2]=a5(t,d,g,l,b)|0;y=t+(b<<2)|0;C=(c[y>>2]|0)+x|0;c[y>>2]=C;if(C>>>0<x>>>0){do{C=y+4|0;y=C;B=(c[C>>2]|0)+1|0;c[C>>2]=B;}while((B|0)==0)}c[l+(g<<2)>>2]=bu(l,d+(g<<2)|0,g,1)|0;if((be(t,l,g+1|0)|0)<0){y=u;B=l;C=t;A=g+1|0;bX(y,B,C,A)|0;w=w^1}else{A=u;C=t;B=l;y=g+1|0;bX(A,C,B,y)|0}bo(t,t,l,g+1|0)|0;x=bu(v,d,g,1)|0;x=x+(bo(v,v,d+(g<<2)|0,g)|0)|0;x=(x<<1)+(bu(v,v,g,1)|0)|0;c[v+(g<<2)>>2]=x+(a5(v,v,g,d+(g<<1<<2)|0,b)|0);bD(f,o,t,g+1|0);bD(f+(g<<1<<2)+4|0,p,u,g+1|0);bD(f+(g<<2<<2)+8|0,q,v,g+1|0);c[f+((g*6|0)<<2)+12+(g<<1<<2)>>2]=0;bD(f+((g*6|0)<<2)+12|0,n,s,g+((c[n+(g<<2)>>2]|c[s+(g<<2)>>2]|0)!=0)|0);c[j+(g<<1<<2)+(g<<1<<2)>>2]=0;bD(j+(g<<1<<2)|0,m,r,g+((c[m+(g<<2)>>2]|c[r+(g<<2)>>2]|0)!=0)|0);bD(j,a,d,g);if((k|0)>(b|0)){r=j+((g*6|0)<<2)|0;m=a+(g<<2<<2)|0;s=k;n=d+(g<<1<<2)|0;v=b;cu(r,m,s,n,v)|0}else{v=j+((g*6|0)<<2)|0;n=d+(g<<1<<2)|0;d=b;s=a+(g<<2<<2)|0;a=k;cu(v,n,d,s,a)|0}cq(j,g,w,f+(g<<1<<2)+4|0,f+((g*6|0)<<2)+12|0,f,f+(g<<2<<2)+8|0,k+b|0,f+(g<<3<<2)+16|0);if((((e|0)!=0|0)!=0|0)!=0){ct(e)}i=h;return}function c_(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;h=a;a=b;b=d;d=e;e=f;f=g;if((b|0)>=(e<<1|0)){i=((b-1|0)>>>0)/6|0}else{i=((e-1|0)>>>0)/3|0}g=i+1|0;i=b-(g*5|0)|0;b=e-(g<<1)|0;e=ci(h+((g*5|0)<<2)+8|0,h+((g*3|0)<<2)|0,5,a,g,i,2,h)|0;c[h+(g<<2)>>2]=bu(h,d+(g<<2)|0,g,2)|0;c[h+((g*6|0)<<2)+12+(b<<2)>>2]=bu(h+((g*6|0)<<2)+12|0,d+(g<<1<<2)|0,b,4)|0;if((g|0)==(b|0)){j=bo(h+((g*6|0)<<2)+12|0,h+((g*6|0)<<2)+12|0,d+(0<<2)|0,g)|0;k=h+((g*6|0)<<2)+12+(g<<2)|0;c[k>>2]=(c[k>>2]|0)+j}else{c[h+((g*6|0)<<2)+12+(g<<2)>>2]=a5(h+((g*6|0)<<2)+12|0,d+(0<<2)|0,g,h+((g*6|0)<<2)+12|0,b+1|0)|0}e=e^(c$(h+(g<<2<<2)+4|0,h+((g*6|0)<<2)+12|0,h,g+1|0)|0);bD(h,h+((g*3|0)<<2)|0,h+(g<<2<<2)+4|0,g+1|0);bD(f+((g*3|0)<<2)+4|0,h+((g*5|0)<<2)+8|0,h+((g*6|0)<<2)+12|0,g+1|0);cd(f+((g*3|0)<<2)+4|0,(g<<1)+1|0,h,e,g,2,4);e=cg(h+((g*5|0)<<2)+8|0,h+((g*3|0)<<2)|0,5,a,g,i,h)|0;j=a5(f+((g*6|0)<<2)+8|0,d+(0<<2)|0,g,d+(g<<1<<2)|0,b)|0;c[h+((g*6|0)<<2)+12+(g<<2)>>2]=j+(bo(h+((g*6|0)<<2)+12|0,f+((g*6|0)<<2)+8|0,d+(g<<2)|0,g)|0);do{if((j|0)==0){if((be(f+((g*6|0)<<2)+8|0,d+(g<<2)|0,g)|0)>=0){l=5269;break}k=h+(g<<2<<2)+4|0;m=d+(g<<2)|0;n=f+((g*6|0)<<2)+8|0;o=g;bX(k,m,n,o)|0;c[h+(g<<2<<2)+4+(g<<2)>>2]=0;e=~e}else{l=5269}}while(0);if((l|0)==5269){j=j-(bX(h+(g<<2<<2)+4|0,f+((g*6|0)<<2)+8|0,d+(g<<2)|0,g)|0)|0;c[h+(g<<2<<2)+4+(g<<2)>>2]=j}bD(h,h+((g*3|0)<<2)|0,h+(g<<2<<2)+4|0,g+1|0);bD(f,h+((g*5|0)<<2)+8|0,h+((g*6|0)<<2)+12|0,g+1|0);cd(f,(g<<1)+1|0,h,e,g,0,0);e=ch(h+((g*5|0)<<2)+8|0,h+((g*3|0)<<2)|0,5,a,g,i,h)|0;c[h+(g<<2)>>2]=bu(h,d+(g<<2)|0,g,1)|0;c[h+((g*6|0)<<2)+12+(b<<2)>>2]=bu(h+((g*6|0)<<2)+12|0,d+(g<<1<<2)|0,b,2)|0;if((g|0)==(b|0)){j=bo(h+((g*6|0)<<2)+12|0,h+((g*6|0)<<2)+12|0,d+(0<<2)|0,g)|0;l=h+((g*6|0)<<2)+12+(g<<2)|0;c[l>>2]=(c[l>>2]|0)+j}else{c[h+((g*6|0)<<2)+12+(g<<2)>>2]=a5(h+((g*6|0)<<2)+12|0,d+(0<<2)|0,g,h+((g*6|0)<<2)+12|0,b+1|0)|0}e=e^(c$(h+(g<<2<<2)+4|0,h+((g*6|0)<<2)+12|0,h,g+1|0)|0);bD(h,h+((g*3|0)<<2)|0,h+(g<<2<<2)+4|0,g+1|0);bD(h+((g*3|0)<<2)|0,h+((g*5|0)<<2)+8|0,h+((g*6|0)<<2)+12|0,g+1|0);cd(h+((g*3|0)<<2)|0,(g<<1)+1|0,h,e,g,1,2);bD(h,a,d,g);if((i|0)>(b|0)){e=h+((g*7|0)<<2)|0;j=a+((g*5|0)<<2)|0;l=i;o=d+(g<<1<<2)|0;n=b;cu(e,j,l,o,n)|0;p=h;q=g;r=f;s=g;t=s*3|0;u=r+(t<<2)|0;v=u+4|0;w=f;x=i;y=b;z=x+y|0;A=f;B=g;C=B*6|0;D=A+(C<<2)|0;E=D+8|0;c2(p,q,v,w,z,E);return}else{n=h+((g*7|0)<<2)|0;o=d+(g<<1<<2)|0;d=b;l=a+((g*5|0)<<2)|0;a=i;cu(n,o,d,l,a)|0;p=h;q=g;r=f;s=g;t=s*3|0;u=r+(t<<2)|0;v=u+4|0;w=f;x=i;y=b;z=x+y|0;A=f;B=g;C=B*6|0;D=A+(C<<2)|0;E=D+8|0;c2(p,q,v,w,z,E);return}}function c$(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b;b=c;c=d;d=c0(a,e,b,c)|0;bo(e,e,b,c)|0;return d|0}function c0(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a;a=b;b=d;d=e;while(1){e=d-1|0;d=e;if((e|0)<0){g=5301;break}h=c[a+(d<<2)>>2]|0;i=c[b+(d<<2)>>2]|0;if((h|0)!=(i|0)){break}c[f+(d<<2)>>2]=0}if((g|0)==5301){j=0;k=j;return k|0}d=d+1|0;if(h>>>0>i>>>0){i=f;h=a;g=b;e=d;bX(i,h,g,e)|0;j=0;k=j;return k|0}else{e=f;f=b;b=a;a=d;bX(e,f,b,a)|0;j=-1;k=j;return k|0}return 0}function c1(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;if((b&2|0)!=0){h=e;j=f;k=e;l=(a<<1)+1|0;bo(h,j,k,l)|0}else{l=e;k=f;j=e;h=(a<<1)+1|0;bX(l,k,j,h)|0}bN(e,e,(a<<1)+1|0,2)|0;h=bX(f,f,i,a<<1)|0;j=f+(a<<1<<2)|0;c[j>>2]=(c[j>>2]|0)-h;bN(f,f,(a<<1)+1|0,1)|0;bX(f,f,e,(a<<1)+1|0)|0;bN(f,f,(a<<1)+1|0,1)|0;if((b&1|0)!=0){b=d;h=i+(a<<1<<2)|0;j=d;k=(a<<1)+1|0;bo(b,h,j,k)|0;k=d;j=d;h=(a<<1)+1|0;bN(k,j,h,1)|0}else{h=d;j=i+(a<<1<<2)|0;k=d;b=(a<<1)+1|0;bX(h,j,k,b)|0;b=d;k=d;j=(a<<1)+1|0;bN(b,k,j,1)|0}bX(e,e,d,(a<<1)+1|0)|0;cy(e,e,(a<<1)+1|0,1431655765,0)|0;bX(i+(a<<1<<2)|0,i+(a<<1<<2)|0,d,(a<<1)+1|0)|0;j=bX(i+(a<<1<<2)|0,i+(a<<1<<2)|0,i,a<<1)|0;k=i+(a<<1<<2)+(a<<1<<2)|0;c[k>>2]=(c[k>>2]|0)-j;bX(f,f,i+(a<<1<<2)|0,(a<<1)+1|0)|0;cy(f,f,(a<<1)+1|0,1431655765,0)|0;j=bo(i+(a<<2)|0,i+(a<<2)|0,d,(a<<1)+1|0)|0;k=i+((a*3|0)<<2)+4|0;b=(c[k>>2]|0)+j|0;c[k>>2]=b;if(b>>>0<j>>>0){do{b=k+4|0;k=b;h=(c[b>>2]|0)+1|0;c[b>>2]=h;}while((h|0)==0)}j=bu(d,i+((a*5|0)<<2)|0,g,2)|0;j=j+(bX(e,e,d,g)|0)|0;d=e+(g<<2)|0;k=c[d>>2]|0;c[d>>2]=k-j;if(k>>>0<j>>>0){do{k=d+4|0;d=k;h=c[k>>2]|0;c[k>>2]=h-1;}while((h|0)==0)}j=bX(i+(a<<2)|0,i+(a<<2)|0,e,a)|0;d=i+(a<<1<<2)|0;h=c[d>>2]|0;c[d>>2]=h-j;if(h>>>0<j>>>0){do{h=d+4|0;d=h;k=c[h>>2]|0;c[h>>2]=k-1;}while((k|0)==0)}d=c[i+(a<<1<<2)+(a<<1<<2)>>2]|0;k=d+(bo(i+((a*3|0)<<2)|0,i+((a*3|0)<<2)|0,e,a)|0)|0;d=c[e+(a<<1<<2)>>2]|0;j=d+(bo(i+(a<<2<<2)|0,f,e+(a<<2)|0,a)|0)|0;e=f+(a<<2)|0;d=(c[e>>2]|0)+j|0;c[e>>2]=d;if(d>>>0<j>>>0){do{d=e+4|0;e=d;h=(c[d>>2]|0)+1|0;c[d>>2]=h;}while((h|0)==0)}if((((g|0)>(a|0)|0)!=0|0)!=0){e=c[f+(a<<1<<2)>>2]|0;m=e+(bo(i+((a*5|0)<<2)|0,i+((a*5|0)<<2)|0,f+(a<<2)|0,a)|0)|0}else{m=bo(i+((a*5|0)<<2)|0,i+((a*5|0)<<2)|0,f+(a<<2)|0,g)|0}j=bX(i+(a<<1<<2)|0,i+(a<<1<<2)|0,i+(a<<2<<2)|0,a+g|0)|0;f=(c[i+((a*5|0)<<2)+(g-1<<2)>>2]|0)-1|0;c[i+((a*5|0)<<2)+(g-1<<2)>>2]=1;if((((g|0)>(a|0)|0)!=0|0)==0){e=i+(a<<2<<2)|0;h=(c[e>>2]|0)+k|0;c[e>>2]=h;if(h>>>0<k>>>0){do{h=e+4|0;e=h;d=(c[h>>2]|0)+1|0;c[h>>2]=d;}while((d|0)==0)}e=i+((a*3|0)<<2)+(g<<2)|0;d=c[e>>2]|0;c[e>>2]=d-(j+m);if(d>>>0<(j+m|0)>>>0){do{d=e+4|0;e=d;h=c[d>>2]|0;c[d>>2]=h-1;}while((h|0)==0)}n=f;o=g;p=o-1|0;q=i;r=a;s=r*5|0;t=q+(s<<2)|0;u=t+(p<<2)|0;v=c[u>>2]|0;w=v+n|0;c[u>>2]=w;return}if(k>>>0>m>>>0){e=i+(a<<2<<2)|0;h=(c[e>>2]|0)+(k-m)|0;c[e>>2]=h;if(h>>>0<(k-m|0)>>>0){do{h=e+4|0;e=h;d=(c[h>>2]|0)+1|0;c[h>>2]=d;}while((d|0)==0)}}else{e=i+(a<<2<<2)|0;d=c[e>>2]|0;c[e>>2]=d-(m-k);if(d>>>0<(m-k|0)>>>0){do{k=e+4|0;e=k;d=c[k>>2]|0;c[k>>2]=d-1;}while((d|0)==0)}}e=i+((a*3|0)<<2)+(g<<2)|0;d=c[e>>2]|0;c[e>>2]=d-j;if(d>>>0<j>>>0){do{j=e+4|0;e=j;d=c[j>>2]|0;c[j>>2]=d-1;}while((d|0)==0)}e=i+((a*5|0)<<2)+(a<<2)|0;d=(c[e>>2]|0)+m|0;c[e>>2]=d;if(d>>>0<m>>>0){do{m=e+4|0;e=m;d=(c[m>>2]|0)+1|0;c[m>>2]=d;}while((d|0)==0)}n=f;o=g;p=o-1|0;q=i;r=a;s=r*5|0;t=q+(s<<2)|0;u=t+(p<<2)|0;v=c[u>>2]|0;w=v+n|0;c[u>>2]=w;return}function c2(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;h=a;a=b;b=d;d=e;e=f;f=g;g=h+((a*3|0)<<2)|0;i=h+((a*7|0)<<2)|0;j=b+(a<<2)|0;k=c[j>>2]|0;c[j>>2]=k-((c[h>>2]|0)>>>4);if(k>>>0<(c[h>>2]|0)>>>4>>>0){do{k=j+4|0;j=k;l=c[k>>2]|0;c[k>>2]=l-1;}while((l|0)==0)}j=c3(b+(a<<2)|0,h+4|0,(a<<1)-1|0,28,f)|0;l=b+(a<<2)+(a<<1<<2)-4|0;k=c[l>>2]|0;c[l>>2]=k-j;if(k>>>0<j>>>0){do{j=l+4|0;l=j;k=c[j>>2]|0;c[j>>2]=k-1;}while((k|0)==0)}l=c3(b,i,e,12,f)|0;k=b+(e<<2)|0;j=c[k>>2]|0;c[k>>2]=j-l;if(j>>>0<l>>>0){do{j=k+4|0;k=j;m=c[j>>2]|0;c[j>>2]=m-1;}while((m|0)==0)}k=g+(a<<2)|0;m=c[k>>2]|0;c[k>>2]=m-((c[h>>2]|0)>>>2);if(m>>>0<(c[h>>2]|0)>>>2>>>0){do{m=k+4|0;k=m;j=c[m>>2]|0;c[m>>2]=j-1;}while((j|0)==0)}k=c3(g+(a<<2)|0,h+4|0,(a<<1)-1|0,30,f)|0;j=g+(a<<2)+(a<<1<<2)-4|0;m=c[j>>2]|0;c[j>>2]=m-k;if(m>>>0<k>>>0){do{k=j+4|0;j=k;m=c[k>>2]|0;c[k>>2]=m-1;}while((m|0)==0)}l=c3(g,i,e,6,f)|0;j=g+(e<<2)|0;m=c[j>>2]|0;c[j>>2]=m-l;if(m>>>0<l>>>0){do{m=j+4|0;j=m;k=c[m>>2]|0;c[m>>2]=k-1;}while((k|0)==0)}j=bX(d+(a<<2)|0,d+(a<<2)|0,h,a<<1)|0;k=d+((a*3|0)<<2)|0;c[k>>2]=(c[k>>2]|0)-j;l=bX(d,d,i,e)|0;i=d+(e<<2)|0;j=c[i>>2]|0;c[i>>2]=j-l;if(j>>>0<l>>>0){do{j=i+4|0;i=j;k=c[j>>2]|0;c[j>>2]=k-1;}while((k|0)==0)}bX(b,b,g,(a*3|0)+1|0)|0;bN(b,b,(a*3|0)+1|0,2)|0;bX(g,g,d,(a*3|0)+1|0)|0;bX(b,b,g,(a*3|0)+1|0)|0;br(b,b,(a*3|0)+1|0,45);cy(g,g,(a*3|0)+1|0,1431655765,0)|0;c3(g,b,(a*3|0)+1|0,2,f)|0;l=bo(h+(a<<2)|0,h+(a<<2)|0,d,a)|0;l=l-(bX(h+(a<<2)|0,h+(a<<2)|0,g,a)|0)|0;if(0>(l|0)){f=d+(a<<2)|0;do{i=f;f=i+4|0;k=c[i>>2]|0;c[i>>2]=k-1;}while((k|0)==0)}else{f=d+(a<<2)|0;k=(c[f>>2]|0)+l|0;c[f>>2]=k;if(k>>>0<l>>>0){do{k=f+4|0;f=k;i=(c[k>>2]|0)+1|0;c[k>>2]=i;}while((i|0)==0)}}l=bX(h+(a<<1<<2)|0,d+(a<<2)|0,g+(a<<2)|0,a)|0;f=d+(a<<1<<2)|0;i=c[f>>2]|0;c[f>>2]=i-l;if(i>>>0<l>>>0){do{i=f+4|0;f=i;k=c[i>>2]|0;c[i>>2]=k-1;}while((k|0)==0)}l=bo(h+((a*3|0)<<2)|0,g,d+(a<<1<<2)|0,a+1|0)|0;d=bo(g+(a<<1<<2)|0,g+(a<<1<<2)|0,b,a)|0;f=g+((a*3|0)<<2)|0;c[f>>2]=(c[f>>2]|0)+d;l=l-(bX(h+((a*3|0)<<2)|0,h+((a*3|0)<<2)|0,g+(a<<1<<2)|0,a+1|0)|0)|0;if(((0>(l|0)|0)!=0|0)!=0){d=g+(a<<2)+4|0;do{f=d;d=f+4|0;k=c[f>>2]|0;c[f>>2]=k-1;}while((k|0)==0)}else{d=g+(a<<2)+4|0;k=(c[d>>2]|0)+l|0;c[d>>2]=k;if(k>>>0<l>>>0){do{k=d+4|0;d=k;f=(c[k>>2]|0)+1|0;c[k>>2]=f;}while((f|0)==0)}}bX(h+(a<<2<<2)|0,g+(a<<2)|0,b+(a<<2)|0,(a<<1)+1|0)|0;l=bn(h+((a*6|0)<<2)|0,b+(a<<2)|0,a,c[h+((a*6|0)<<2)>>2]|0)|0;g=b+(a<<1<<2)|0;d=(c[g>>2]|0)+l|0;c[g>>2]=d;if(d>>>0<l>>>0){do{d=g+4|0;g=d;f=(c[d>>2]|0)+1|0;c[d>>2]=f;}while((f|0)==0)}l=bo(h+((a*7|0)<<2)|0,h+((a*7|0)<<2)|0,b+(a<<1<<2)|0,a)|0;if((((e|0)!=(a|0)|0)!=0|0)==0){return}e=h+(a<<3<<2)|0;h=(c[e>>2]|0)+(l+(c[b+((a*3|0)<<2)>>2]|0))|0;c[e>>2]=h;if(h>>>0<(l+(c[b+((a*3|0)<<2)>>2]|0)|0)>>>0){do{a=e+4|0;e=a;b=(c[a>>2]|0)+1|0;c[a>>2]=b;}while((b|0)==0)}return}function c3(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=c;c=e;e=bu(c,b,a,d)|0;return e+(bX(f,f,c,a)|0)|0}function c4(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=d;d=e;a=a+(b<<2)|0;f=f+(b<<2)|0;e=32-d|0;g=a-4|0;a=g;h=c[g>>2]|0;g=h>>>(e>>>0);i=h<<d;j=b-1|0;while(1){if((j|0)==0){break}b=a-4|0;a=b;h=c[b>>2]|0;b=f-4|0;f=b;c[b>>2]=~(i|h>>>(e>>>0));i=h<<d;j=j-1|0}j=f-4|0;f=j;c[j>>2]=~i;return g|0}
function c5(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,au=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1844]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=7416+(h<<2)|0;j=7416+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1844]=e&~(1<<g)}else{if(l>>>0<(c[1848]|0)>>>0){at();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{at();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1846]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=7416+(p<<2)|0;m=7416+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1844]=e&~(1<<r)}else{if(l>>>0<(c[1848]|0)>>>0){at();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{at();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1846]|0;if((l|0)!=0){q=c[1849]|0;d=l>>>3;l=d<<1;f=7416+(l<<2)|0;k=c[1844]|0;h=1<<d;do{if((k&h|0)==0){c[1844]=k|h;s=f;t=7416+(l+2<<2)|0}else{d=7416+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1848]|0)>>>0){s=g;t=d;break}at();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1846]=m;c[1849]=e;n=i;return n|0}l=c[1845]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[7680+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1848]|0;if(r>>>0<i>>>0){at();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){at();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){at();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){at();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){at();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{at();return 0}}}while(0);L6978:do{if((e|0)!=0){f=d+28|0;i=7680+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1845]=c[1845]&~(1<<c[f>>2]);break L6978}else{if(e>>>0<(c[1848]|0)>>>0){at();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L6978}}}while(0);if(v>>>0<(c[1848]|0)>>>0){at();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1848]|0)>>>0){at();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1848]|0)>>>0){at();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[1846]|0;if((f|0)!=0){e=c[1849]|0;i=f>>>3;f=i<<1;q=7416+(f<<2)|0;k=c[1844]|0;g=1<<i;do{if((k&g|0)==0){c[1844]=k|g;y=q;z=7416+(f+2<<2)|0}else{i=7416+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1848]|0)>>>0){y=l;z=i;break}at();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1846]=p;c[1849]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1845]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[7680+(A<<2)>>2]|0;L6786:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L6786}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[7680+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[1846]|0)-g|0)>>>0){o=g;break}q=K;m=c[1848]|0;if(q>>>0<m>>>0){at();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){at();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){at();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){at();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){at();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{at();return 0}}}while(0);L6836:do{if((e|0)!=0){i=K+28|0;m=7680+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[1845]=c[1845]&~(1<<c[i>>2]);break L6836}else{if(e>>>0<(c[1848]|0)>>>0){at();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L6836}}}while(0);if(L>>>0<(c[1848]|0)>>>0){at();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1848]|0)>>>0){at();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1848]|0)>>>0){at();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;m=7416+(e<<2)|0;r=c[1844]|0;j=1<<i;do{if((r&j|0)==0){c[1844]=r|j;O=m;P=7416+(e+2<<2)|0}else{i=7416+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1848]|0)>>>0){O=d;P=i;break}at();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=7680+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[1845]|0;l=1<<Q;if((m&l|0)==0){c[1845]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=5674;break}else{l=l<<1;m=j}}if((T|0)==5674){if(S>>>0<(c[1848]|0)>>>0){at();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[1848]|0;if(m>>>0<i>>>0){at();return 0}if(j>>>0<i>>>0){at();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[1846]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1849]|0;if(S>>>0>15){R=J;c[1849]=R+o;c[1846]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1846]=0;c[1849]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1847]|0;if(o>>>0<J>>>0){S=J-o|0;c[1847]=S;J=c[1850]|0;K=J;c[1850]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1838]|0)==0){J=al(30)|0;if((J-1&J|0)==0){c[1840]=J;c[1839]=J;c[1841]=-1;c[1842]=-1;c[1843]=0;c[1955]=0;c[1838]=(av(0)|0)&-16^1431655768;break}else{at();return 0}}}while(0);J=o+48|0;S=c[1840]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1954]|0;do{if((O|0)!=0){P=c[1952]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L7045:do{if((c[1955]&4|0)==0){O=c[1850]|0;L7047:do{if((O|0)==0){T=5704}else{L=O;P=7824;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=5704;break L7047}else{P=M}}if((P|0)==0){T=5704;break}L=R-(c[1847]|0)&Q;if(L>>>0>=2147483647){W=0;break}m=am(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=5713}}while(0);do{if((T|0)==5704){O=am(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1839]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[1952]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}m=c[1954]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=am($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=5713}}while(0);L7067:do{if((T|0)==5713){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=5724;break L7045}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1840]|0;O=K-_+g&-g;if(O>>>0>=2147483647){ac=_;break}if((am(O|0)|0)==-1){am(m|0)|0;W=Y;break L7067}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=5724;break L7045}}}while(0);c[1955]=c[1955]|4;ad=W;T=5721}else{ad=0;T=5721}}while(0);do{if((T|0)==5721){if(S>>>0>=2147483647){break}W=am(S|0)|0;Z=am(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=5724}}}while(0);do{if((T|0)==5724){ad=(c[1952]|0)+aa|0;c[1952]=ad;if(ad>>>0>(c[1953]|0)>>>0){c[1953]=ad}ad=c[1850]|0;L7087:do{if((ad|0)==0){S=c[1848]|0;if((S|0)==0|ab>>>0<S>>>0){c[1848]=ab}c[1956]=ab;c[1957]=aa;c[1959]=0;c[1853]=c[1838];c[1852]=-1;S=0;do{Y=S<<1;ac=7416+(Y<<2)|0;c[7416+(Y+3<<2)>>2]=ac;c[7416+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[1850]=ab+ae;c[1847]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[1851]=c[1842]}else{S=7824;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=5736;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==5736){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[1850]|0;Y=(c[1847]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1850]=Z+ai;c[1847]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[1851]=c[1842];break L7087}}while(0);if(ab>>>0<(c[1848]|0)>>>0){c[1848]=ab}S=ab+aa|0;Y=7824;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=5746;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==5746){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){an=0}else{an=-S&7}S=ab+(an+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[1850]|0)){J=(c[1847]|0)+K|0;c[1847]=J;c[1850]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[1849]|0)){J=(c[1846]|0)+K|0;c[1846]=J;c[1849]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+an)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L7122:do{if(X>>>0<256){U=c[ab+((an|8)+aa)>>2]|0;Q=c[ab+(aa+12+an)>>2]|0;R=7416+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1848]|0)>>>0){at();return 0}if((c[U+12>>2]|0)==(Z|0)){break}at();return 0}}while(0);if((Q|0)==(U|0)){c[1844]=c[1844]&~(1<<V);break}do{if((Q|0)==(R|0)){ao=Q+8|0}else{if(Q>>>0<(c[1848]|0)>>>0){at();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){ao=m;break}at();return 0}}while(0);c[U+12>>2]=Q;c[ao>>2]=U}else{R=S;m=c[ab+((an|24)+aa)>>2]|0;P=c[ab+(aa+12+an)>>2]|0;do{if((P|0)==(R|0)){O=an|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){ap=0;break}else{aq=O;ar=e}}else{aq=L;ar=g}while(1){g=aq+20|0;L=c[g>>2]|0;if((L|0)!=0){aq=L;ar=g;continue}g=aq+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{aq=L;ar=g}}if(ar>>>0<(c[1848]|0)>>>0){at();return 0}else{c[ar>>2]=0;ap=aq;break}}else{g=c[ab+((an|8)+aa)>>2]|0;if(g>>>0<(c[1848]|0)>>>0){at();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){at();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;ap=P;break}else{at();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+an)|0;U=7680+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=ap;if((ap|0)!=0){break}c[1845]=c[1845]&~(1<<c[P>>2]);break L7122}else{if(m>>>0<(c[1848]|0)>>>0){at();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=ap}else{c[m+20>>2]=ap}if((ap|0)==0){break L7122}}}while(0);if(ap>>>0<(c[1848]|0)>>>0){at();return 0}c[ap+24>>2]=m;R=an|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1848]|0)>>>0){at();return 0}else{c[ap+16>>2]=P;c[P+24>>2]=ap;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1848]|0)>>>0){at();return 0}else{c[ap+20>>2]=P;c[P+24>>2]=ap;break}}}while(0);as=ab+(($|an)+aa)|0;au=$+K|0}else{as=Z;au=K}J=as+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=au|1;c[ab+(au+W)>>2]=au;J=au>>>3;if(au>>>0<256){V=J<<1;X=7416+(V<<2)|0;P=c[1844]|0;m=1<<J;do{if((P&m|0)==0){c[1844]=P|m;ax=X;ay=7416+(V+2<<2)|0}else{J=7416+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1848]|0)>>>0){ax=U;ay=J;break}at();return 0}}while(0);c[ay>>2]=_;c[ax+12>>2]=_;c[ab+(W+8)>>2]=ax;c[ab+(W+12)>>2]=X;break}V=ac;m=au>>>8;do{if((m|0)==0){az=0}else{if(au>>>0>16777215){az=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;az=au>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=7680+(az<<2)|0;c[ab+(W+28)>>2]=az;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[1845]|0;Q=1<<az;if((X&Q|0)==0){c[1845]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((az|0)==31){aA=0}else{aA=25-(az>>>1)|0}Q=au<<aA;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(au|0)){break}aB=X+16+(Q>>>31<<2)|0;m=c[aB>>2]|0;if((m|0)==0){T=5819;break}else{Q=Q<<1;X=m}}if((T|0)==5819){if(aB>>>0<(c[1848]|0)>>>0){at();return 0}else{c[aB>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[1848]|0;if(X>>>0<$>>>0){at();return 0}if(m>>>0<$>>>0){at();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=7824;while(1){aC=c[W>>2]|0;if(aC>>>0<=Y>>>0){aD=c[W+4>>2]|0;aE=aC+aD|0;if(aE>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=aC+(aD-39)|0;if((W&7|0)==0){aF=0}else{aF=-W&7}W=aC+(aD-47+aF)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aG=0}else{aG=-_&7}_=aa-40-aG|0;c[1850]=ab+aG;c[1847]=_;c[ab+(aG+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[1851]=c[1842];c[ac+4>>2]=27;c[W>>2]=c[1956];c[W+4>>2]=c[1957];c[W+8>>2]=c[1958];c[W+12>>2]=c[1959];c[1956]=ab;c[1957]=aa;c[1959]=0;c[1958]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aE>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aE>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256){K=W<<1;Z=7416+(K<<2)|0;S=c[1844]|0;m=1<<W;do{if((S&m|0)==0){c[1844]=S|m;aH=Z;aI=7416+(K+2<<2)|0}else{W=7416+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[1848]|0)>>>0){aH=Q;aI=W;break}at();return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aJ=0}else{if(_>>>0>16777215){aJ=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aJ=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=7680+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1845]|0;Q=1<<aJ;if((Z&Q|0)==0){c[1845]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=_<<aK;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aL=Z+16+(Q>>>31<<2)|0;m=c[aL>>2]|0;if((m|0)==0){T=5854;break}else{Q=Q<<1;Z=m}}if((T|0)==5854){if(aL>>>0<(c[1848]|0)>>>0){at();return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[1848]|0;if(Z>>>0<m>>>0){at();return 0}if(_>>>0<m>>>0){at();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1847]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[1847]=_;ad=c[1850]|0;Q=ad;c[1850]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(aw()|0)>>2]=12;n=0;return n|0}function c6(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[1848]|0;if(b>>>0<e>>>0){at()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){at()}h=f&-8;i=a+(h-8)|0;j=i;L7304:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){at()}if((n|0)==(c[1849]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1846]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=7416+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){at()}if((c[k+12>>2]|0)==(n|0)){break}at()}}while(0);if((s|0)==(k|0)){c[1844]=c[1844]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){at()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}at()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){at()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){at()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){at()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{at()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=7680+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1845]=c[1845]&~(1<<c[v>>2]);q=n;r=o;break L7304}else{if(p>>>0<(c[1848]|0)>>>0){at()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L7304}}}while(0);if(A>>>0<(c[1848]|0)>>>0){at()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1848]|0)>>>0){at()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1848]|0)>>>0){at()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){at()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){at()}do{if((e&2|0)==0){if((j|0)==(c[1850]|0)){B=(c[1847]|0)+r|0;c[1847]=B;c[1850]=q;c[q+4>>2]=B|1;if((q|0)!=(c[1849]|0)){return}c[1849]=0;c[1846]=0;return}if((j|0)==(c[1849]|0)){B=(c[1846]|0)+r|0;c[1846]=B;c[1849]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L7406:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=7416+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[1848]|0)>>>0){at()}if((c[u+12>>2]|0)==(j|0)){break}at()}}while(0);if((g|0)==(u|0)){c[1844]=c[1844]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[1848]|0)>>>0){at()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}at()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[1848]|0)>>>0){at()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[1848]|0)>>>0){at()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){at()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{at()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=7680+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[1845]=c[1845]&~(1<<c[t>>2]);break L7406}else{if(f>>>0<(c[1848]|0)>>>0){at()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L7406}}}while(0);if(E>>>0<(c[1848]|0)>>>0){at()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[1848]|0)>>>0){at()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[1848]|0)>>>0){at()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[1849]|0)){H=B;break}c[1846]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=7416+(d<<2)|0;A=c[1844]|0;E=1<<r;do{if((A&E|0)==0){c[1844]=A|E;I=e;J=7416+(d+2<<2)|0}else{r=7416+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1848]|0)>>>0){I=h;J=r;break}at()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=7680+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1845]|0;d=1<<K;do{if((r&d|0)==0){c[1845]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=6031;break}else{A=A<<1;J=E}}if((N|0)==6031){if(M>>>0<(c[1848]|0)>>>0){at()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[1848]|0;if(J>>>0<E>>>0){at()}if(B>>>0<E>>>0){at()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[1852]|0)-1|0;c[1852]=q;if((q|0)==0){O=7832}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[1852]=-1;return}function c7(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=c5(b)|0;return d|0}if(b>>>0>4294967231){c[(aw()|0)>>2]=12;d=0;return d|0}if(b>>>0<11){e=16}else{e=b+11&-8}f=c8(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=c5(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;dc(f|0,a|0,e)|0;c6(a);d=f;return d|0}function c8(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[1848]|0;if(g>>>0<j>>>0){at();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){at();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){at();return 0}if((k|0)==0){if(b>>>0<256){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[1840]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;c9(g+b|0,k);n=a;return n|0}if((i|0)==(c[1850]|0)){k=(c[1847]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[1850]=g+b;c[1847]=l;n=a;return n|0}if((i|0)==(c[1849]|0)){l=(c[1846]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[1846]=q;c[1849]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L7593:do{if(m>>>0<256){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=7416+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){at();return 0}if((c[l+12>>2]|0)==(i|0)){break}at();return 0}}while(0);if((k|0)==(l|0)){c[1844]=c[1844]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){at();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}at();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){at();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){at();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){at();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{at();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=7680+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[1845]=c[1845]&~(1<<c[t>>2]);break L7593}else{if(s>>>0<(c[1848]|0)>>>0){at();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L7593}}}while(0);if(y>>>0<(c[1848]|0)>>>0){at();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[1848]|0)>>>0){at();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[1848]|0)>>>0){at();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;c9(g+b|0,q);n=a;return n|0}return 0}function c9(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L7669:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[1848]|0;if(i>>>0<l>>>0){at()}if((j|0)==(c[1849]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[1846]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=7416+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){at()}if((c[p+12>>2]|0)==(j|0)){break}at()}}while(0);if((q|0)==(p|0)){c[1844]=c[1844]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){at()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}at()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){at()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){at()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){at()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{at()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=7680+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[1845]=c[1845]&~(1<<c[t>>2]);n=j;o=k;break L7669}else{if(m>>>0<(c[1848]|0)>>>0){at()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L7669}}}while(0);if(y>>>0<(c[1848]|0)>>>0){at()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1848]|0)>>>0){at()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[1848]|0)>>>0){at()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[1848]|0;if(e>>>0<a>>>0){at()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[1850]|0)){A=(c[1847]|0)+o|0;c[1847]=A;c[1850]=n;c[n+4>>2]=A|1;if((n|0)!=(c[1849]|0)){return}c[1849]=0;c[1846]=0;return}if((f|0)==(c[1849]|0)){A=(c[1846]|0)+o|0;c[1846]=A;c[1849]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L7769:do{if(z>>>0<256){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=7416+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){at()}if((c[g+12>>2]|0)==(f|0)){break}at()}}while(0);if((t|0)==(g|0)){c[1844]=c[1844]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){at()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}at()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){at()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){at()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){at()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{at()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=7680+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[1845]=c[1845]&~(1<<c[l>>2]);break L7769}else{if(m>>>0<(c[1848]|0)>>>0){at()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L7769}}}while(0);if(C>>>0<(c[1848]|0)>>>0){at()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[1848]|0)>>>0){at()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[1848]|0)>>>0){at()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[1849]|0)){F=A;break}c[1846]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256){z=o<<1;y=7416+(z<<2)|0;C=c[1844]|0;b=1<<o;do{if((C&b|0)==0){c[1844]=C|b;G=y;H=7416+(z+2<<2)|0}else{o=7416+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[1848]|0)>>>0){G=d;H=o;break}at()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=7680+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[1845]|0;z=1<<I;if((o&z|0)==0){c[1845]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=6311;break}else{I=I<<1;J=G}}if((L|0)==6311){if(K>>>0<(c[1848]|0)>>>0){at()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[1848]|0;if(J>>>0<I>>>0){at()}if(L>>>0<I>>>0){at()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function da(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function db(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function dc(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function dd(a,b){a=a|0;b=b|0;return az[a&3](b|0)|0}function de(a,b){a=a|0;b=b|0;aA[a&1](b|0)}function df(a,b,c){a=a|0;b=b|0;c=c|0;aB[a&3](b|0,c|0)}function dg(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return aC[a&3](b|0,c|0,d|0)|0}function dh(a){a=a|0;aD[a&1]()}function di(a,b,c){a=a|0;b=b|0;c=c|0;return aE[a&1](b|0,c|0)|0}function dj(a){a=a|0;$(0);return 0}function dk(a){a=a|0;$(1)}function dl(a,b){a=a|0;b=b|0;$(2)}function dm(a,b,c){a=a|0;b=b|0;c=c|0;$(3);return 0}function dn(){$(4)}function dp(a,b){a=a|0;b=b|0;$(5);return 0}
// EMSCRIPTEN_END_FUNCS
var az=[dj,dj,bk,dj];var aA=[dk,dk];var aB=[dl,dl,bm,dl];var aC=[dm,dm,bl,dm];var aD=[dn,dn];var aE=[dp,dp];return{_strlen:db,_free:c6,_realloc:c7,_memset:da,_del_mpz_var:aY,_new_mpz_var:aX,_malloc:c5,_init_mpz_vars:aW,_memcpy:dc,_w_mpz_get_str:a_,_w_mpz_add:a$,_w_mpz_set_str:aZ,runPostSets:aV,stackAlloc:aF,stackSave:aG,stackRestore:aH,setThrew:aI,setTempRet0:aL,setTempRet1:aM,setTempRet2:aN,setTempRet3:aO,setTempRet4:aP,setTempRet5:aQ,setTempRet6:aR,setTempRet7:aS,setTempRet8:aT,setTempRet9:aU,dynCall_ii:dd,dynCall_vi:de,dynCall_vii:df,dynCall_iiii:dg,dynCall_v:dh,dynCall_iii:di}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiii": invoke_iiii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "_pwrite": _pwrite, "_sysconf": _sysconf, "_sbrk": _sbrk, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "__reallyNegative": __reallyNegative, "__formatString": __formatString, "_send": _send, "_write": _write, "_abort": _abort, "_fprintf": _fprintf, "_time": _time, "___errno_location": ___errno_location, "_fflush": _fflush, "_isspace": _isspace, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _memset = Module["_memset"] = asm["_memset"];
var _del_mpz_var = Module["_del_mpz_var"] = asm["_del_mpz_var"];
var _new_mpz_var = Module["_new_mpz_var"] = asm["_new_mpz_var"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _init_mpz_vars = Module["_init_mpz_vars"] = asm["_init_mpz_vars"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _w_mpz_get_str = Module["_w_mpz_get_str"] = asm["_w_mpz_get_str"];
var _w_mpz_add = Module["_w_mpz_add"] = asm["_w_mpz_add"];
var _w_mpz_set_str = Module["_w_mpz_set_str"] = asm["_w_mpz_set_str"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
var calledRun = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun && shouldRunNow) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + (new Error().stack);
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
