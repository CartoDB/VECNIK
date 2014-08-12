!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.VECNIK=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = _dereq_('base64-js')
var ieee754 = _dereq_('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  if (encoding === 'base64' && type === 'string') {
    subject = base64clean(subject)
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str.toString()
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.compare = function (a, b) {
  assert(Buffer.isBuffer(a) && Buffer.isBuffer(b), 'Arguments must be Buffers')
  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) {
    return -1
  }
  if (y < x) {
    return 1
  }
  return 0
}

// BUFFER INSTANCE METHODS
// =======================

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end === undefined) ? self.length : Number(end)

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = asciiSlice(self, start, end)
      break
    case 'binary':
      ret = binarySlice(self, start, end)
      break
    case 'base64':
      ret = base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

Buffer.prototype.equals = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.compare = function (b) {
  assert(Buffer.isBuffer(b), 'Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return readUInt16(this, offset, false, noAssert)
}

function readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return readInt16(this, offset, false, noAssert)
}

function readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return readInt32(this, offset, false, noAssert)
}

function readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return readFloat(this, offset, false, noAssert)
}

function readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
  return offset + 1
}

function writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
  return offset + 2
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  return writeUInt16(this, value, offset, false, noAssert)
}

function writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
  return offset + 4
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  return writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
  return offset + 1
}

function writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
  return offset + 2
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  return writeInt16(this, value, offset, false, noAssert)
}

function writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
  return offset + 4
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  return writeInt32(this, value, offset, false, noAssert)
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":2,"ieee754":3}],2:[function(_dereq_,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],3:[function(_dereq_,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],4:[function(_dereq_,module,exports){
(function (Buffer){
'use strict';

var ieee754 = _dereq_('ieee754');

module.exports = Protobuf;
function Protobuf(buf) {
    this.buf = buf;
    this.pos = 0;
}

Protobuf.prototype = {
    get length() { return this.buf.length; }
};

Protobuf.Varint = 0;
Protobuf.Int64 = 1;
Protobuf.Message = 2;
Protobuf.String = 2;
Protobuf.Packed = 2;
Protobuf.Int32 = 5;

Protobuf.prototype.destroy = function() {
    this.buf = null;
};

// === READING =================================================================

Protobuf.prototype.readUInt32 = function() {
    var val = this.buf.readUInt32LE(this.pos);
    this.pos += 4;
    return val;
};

Protobuf.prototype.readUInt64 = function() {
    var val = this.buf.readUInt64LE(this.pos);
    this.pos += 8;
    return val;
};

Protobuf.prototype.readDouble = function() {
    var val = ieee754.read(this.buf, this.pos, true, 52, 8);
    this.pos += 8;
    return val;
};

Protobuf.prototype.readVarint = function() {
    // TODO: bounds checking
    var pos = this.pos;
    if (this.buf[pos] <= 0x7f) {
        this.pos++;
        return this.buf[pos];
    } else if (this.buf[pos + 1] <= 0x7f) {
        this.pos += 2;
        return (this.buf[pos] & 0x7f) | (this.buf[pos + 1] << 7);
    } else if (this.buf[pos + 2] <= 0x7f) {
        this.pos += 3;
        return (this.buf[pos] & 0x7f) | (this.buf[pos + 1] & 0x7f) << 7 | (this.buf[pos + 2]) << 14;
    } else if (this.buf[pos + 3] <= 0x7f) {
        this.pos += 4;
        return (this.buf[pos] & 0x7f) | (this.buf[pos + 1] & 0x7f) << 7 | (this.buf[pos + 2] & 0x7f) << 14 | (this.buf[pos + 3]) << 21;
    } else if (this.buf[pos + 4] <= 0x7f) {
        this.pos += 5;
        return ((this.buf[pos] & 0x7f) | (this.buf[pos + 1] & 0x7f) << 7 | (this.buf[pos + 2] & 0x7f) << 14 | (this.buf[pos + 3]) << 21) + (this.buf[pos + 4] * 268435456);
    } else {
        this.skip(Protobuf.Varint);
        return 0;
        // throw new Error("TODO: Handle 6+ byte varints");
    }
};

Protobuf.prototype.readSVarint = function() {
    var num = this.readVarint();
    if (num > 2147483647) throw new Error('TODO: Handle numbers >= 2^30');
    // zigzag encoding
    return ((num >> 1) ^ -(num & 1));
};

Protobuf.prototype.readString = function() {
    var bytes = this.readVarint();
    // TODO: bounds checking
    var chr = String.fromCharCode;
    var b = this.buf;
    var p = this.pos;
    var end = this.pos + bytes;
    var str = '';
    while (p < end) {
        if (b[p] <= 0x7F) str += chr(b[p++]);
        else if (b[p] <= 0xBF) throw new Error('Invalid UTF-8 codepoint: ' + b[p]);
        else if (b[p] <= 0xDF) str += chr((b[p++] & 0x1F) << 6 | (b[p++] & 0x3F));
        else if (b[p] <= 0xEF) str += chr((b[p++] & 0x1F) << 12 | (b[p++] & 0x3F) << 6 | (b[p++] & 0x3F));
        else if (b[p] <= 0xF7) p += 4; // We can't handle these codepoints in JS, so skip.
        else if (b[p] <= 0xFB) p += 5;
        else if (b[p] <= 0xFD) p += 6;
        else throw new Error('Invalid UTF-8 codepoint: ' + b[p]);
    }
    this.pos += bytes;
    return str;
};

Protobuf.prototype.readBuffer = function() {
    var bytes = this.readVarint();
    var buffer = this.buf.subarray(this.pos, this.pos + bytes);
    this.pos += bytes;
    return buffer;
};

Protobuf.prototype.readPacked = function(type) {
    // TODO: bounds checking
    var bytes = this.readVarint();
    var end = this.pos + bytes;
    var array = [];
    while (this.pos < end) {
        array.push(this['read' + type]());
    }
    return array;
};

Protobuf.prototype.skip = function(val) {
    // TODO: bounds checking
    var type = val & 0x7;
    switch (type) {
        /* varint */ case Protobuf.Varint: while (this.buf[this.pos++] > 0x7f); break;
        /* 64 bit */ case Protobuf.Int64: this.pos += 8; break;
        /* length */ case Protobuf.Message: var bytes = this.readVarint(); this.pos += bytes; break;
        /* 32 bit */ case Protobuf.Int32: this.pos += 4; break;
        default: throw new Error('Unimplemented type: ' + type);
    }
};

// === WRITING =================================================================

Protobuf.prototype.writeTag = function(tag, type) {
    this.writeVarint((tag << 3) | type);
};

Protobuf.prototype.realloc = function(min) {
    var length = this.buf.length;
    while (length < this.pos + min) length *= 2;
    if (length != this.buf.length) {
        var buf = new Buffer(length);
        this.buf.copy(buf);
        this.buf = buf;
    }
};

Protobuf.prototype.finish = function() {
    return this.buf.slice(0, this.pos);
};

Protobuf.prototype.writePacked = function(type, tag, items) {
    if (!items.length) return;

    var message = new Protobuf();
    for (var i = 0; i < items.length; i++) {
        message['write' + type](items[i]);
    }
    var data = message.finish();

    this.writeTag(tag, Protobuf.Packed);
    this.writeBuffer(data);
};

Protobuf.prototype.writeUInt32 = function(val) {
    this.realloc(4);
    this.buf.writeUInt32LE(val, this.pos);
    this.pos += 4;
};

Protobuf.prototype.writeTaggedUInt32 = function(tag, val) {
    this.writeTag(tag, Protobuf.Int32);
    this.writeUInt32(val);
};

Protobuf.prototype.writeVarint = function(val) {
    val = Number(val);
    if (isNaN(val)) {
        val = 0;
    }

    if (val <= 0x7f) {
        this.realloc(1);
        this.buf[this.pos++] = val;
    } else if (val <= 0x3fff) {
        this.realloc(2);
        this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
        this.buf[this.pos++] = 0x00 | ((val >>> 7) & 0x7f);
    } else if (val <= 0x1ffffff) {
        this.realloc(3);
        this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
        this.buf[this.pos++] = 0x80 | ((val >>> 7) & 0x7f);
        this.buf[this.pos++] = 0x00 | ((val >>> 14) & 0x7f);
    } else if (val <= 0xfffffff) {
        this.realloc(4);
        this.buf[this.pos++] = 0x80 | ((val >>> 0) & 0x7f);
        this.buf[this.pos++] = 0x80 | ((val >>> 7) & 0x7f);
        this.buf[this.pos++] = 0x80 | ((val >>> 14) & 0x7f);
        this.buf[this.pos++] = 0x00 | ((val >>> 21) & 0x7f);
    } else {
        while (val > 0) {
            var b = val & 0x7f;
            val = Math.floor(val / 128);
            if (val > 0) b |= 0x80
            this.realloc(1);
            this.buf[this.pos++] = b;
        }
    }
};

Protobuf.prototype.writeTaggedVarint = function(tag, val) {
    this.writeTag(tag, Protobuf.Varint);
    this.writeVarint(val);
};

Protobuf.prototype.writeSVarint = function(val) {
    if (val >= 0) {
        this.writeVarint(val * 2);
    } else {
        this.writeVarint(val * -2 - 1);
    }
};

Protobuf.prototype.writeTaggedSVarint = function(tag, val) {
    this.writeTag(tag, Protobuf.Varint);
    this.writeSVarint(val);
};

Protobuf.prototype.writeBoolean = function(val) {
    this.writeVarint(Boolean(val));
};

Protobuf.prototype.writeTaggedBoolean = function(tag, val) {
    this.writeTaggedVarint(tag, Boolean(val));
};

Protobuf.prototype.writeString = function(str) {
    str = String(str);
    var bytes = Buffer.byteLength(str);
    this.writeVarint(bytes);
    this.realloc(bytes);
    this.buf.write(str, this.pos);
    this.pos += bytes;
};

Protobuf.prototype.writeTaggedString = function(tag, str) {
    this.writeTag(tag, Protobuf.String);
    this.writeString(str);
};

Protobuf.prototype.writeFloat = function(val) {
    this.realloc(4);
    this.buf.writeFloatLE(val, this.pos);
    this.pos += 4;
};

Protobuf.prototype.writeTaggedFloat = function(tag, val) {
    this.writeTag(tag, Protobuf.Int32);
    this.writeFloat(val);
};

Protobuf.prototype.writeDouble = function(val) {
    this.realloc(8);
    this.buf.writeDoubleLE(val, this.pos);
    this.pos += 8;
};

Protobuf.prototype.writeTaggedDouble = function(tag, val) {
    this.writeTag(tag, Protobuf.Int64);
    this.writeDouble(val);
};

Protobuf.prototype.writeBuffer = function(buffer) {
    var bytes = buffer.length;
    this.writeVarint(bytes);
    this.realloc(bytes);
    buffer.copy(this.buf, this.pos);
    this.pos += bytes;
};

Protobuf.prototype.writeTaggedBuffer = function(tag, buffer) {
    this.writeTag(tag, Protobuf.String);
    this.writeBuffer(buffer);
};

Protobuf.prototype.writeMessage = function(tag, protobuf) {
    var buffer = protobuf.finish();
    this.writeTag(tag, Protobuf.Message);
    this.writeBuffer(buffer);
};

}).call(this,_dereq_("buffer").Buffer)
},{"buffer":1,"ieee754":5}],5:[function(_dereq_,module,exports){
module.exports=_dereq_(3)
},{}],6:[function(_dereq_,module,exports){
module.exports.VectorTile = _dereq_('./lib/vectortile.js');
module.exports.VectorTileFeature = _dereq_('./lib/vectortilefeature.js');
module.exports.VectorTileLayer = _dereq_('./lib/vectortilelayer.js');

},{"./lib/vectortile.js":7,"./lib/vectortilefeature.js":8,"./lib/vectortilelayer.js":9}],7:[function(_dereq_,module,exports){
'use strict';

var VectorTileLayer = _dereq_('./vectortilelayer');

module.exports = VectorTile;

function VectorTile(buffer, end) {

    this.layers = {};
    this._buffer = buffer;

    end = end || buffer.length;

    while (buffer.pos < end) {
        var val = buffer.readVarint(),
            tag = val >> 3;

        if (tag == 3) {
            var layer = this.readLayer();
            if (layer.length) this.layers[layer.name] = layer;
        } else {
            buffer.skip(val);
        }
    }
}

VectorTile.prototype.readLayer = function() {
    var buffer = this._buffer,
        bytes = buffer.readVarint(),
        end = buffer.pos + bytes,
        layer = new VectorTileLayer(buffer, end);

    buffer.pos = end;

    return layer;
};

},{"./vectortilelayer":9}],8:[function(_dereq_,module,exports){
'use strict';

var Point = _dereq_('point-geometry');

module.exports = VectorTileFeature;

function VectorTileFeature(buffer, end, extent, keys, values) {

    this.properties = {};

    // Public
    this.extent = extent;
    this.type = 0;

    // Private
    this._buffer = buffer;
    this._geometry = -1;

    end = end || buffer.length;

    while (buffer.pos < end) {
        var val = buffer.readVarint(),
            tag = val >> 3;

        if (tag == 1) {
            this._id = buffer.readVarint();

        } else if (tag == 2) {
            var tagEnd = buffer.pos + buffer.readVarint();

            while (buffer.pos < tagEnd) {
                var key = keys[buffer.readVarint()];
                var value = values[buffer.readVarint()];
                this.properties[key] = value;
            }

        } else if (tag == 3) {
            this.type = buffer.readVarint();

        } else if (tag == 4) {
            this._geometry = buffer.pos;
            buffer.skip(val);

        } else {
            buffer.skip(val);
        }
    }
}

VectorTileFeature.types = ['Unknown', 'Point', 'LineString', 'Polygon'];

VectorTileFeature.prototype.loadGeometry = function() {
    var buffer = this._buffer;
    buffer.pos = this._geometry;

    var bytes = buffer.readVarint(),
        end = buffer.pos + bytes,
        cmd = 1,
        length = 0,
        x = 0,
        y = 0,
        lines = [],
        line;

    while (buffer.pos < end) {
        if (!length) {
            var cmd_length = buffer.readVarint();
            cmd = cmd_length & 0x7;
            length = cmd_length >> 3;
        }

        length--;

        if (cmd === 1 || cmd === 2) {
            x += buffer.readSVarint();
            y += buffer.readSVarint();

            if (cmd === 1) {
                // moveTo
                if (line) {
                    lines.push(line);
                }
                line = [];
            }

            line.push(new Point(x, y));
        } else if (cmd === 7) {
            // closePolygon
            line.push(line[0].clone());
        } else {
            throw new Error('unknown command ' + cmd);
        }
    }

    if (line) lines.push(line);

    return lines;
};

VectorTileFeature.prototype.bbox = function() {
    var buffer = this._buffer;
    buffer.pos = this._geometry;

    var bytes = buffer.readVarint(),
        end = buffer.pos + bytes,

        cmd = 1,
        length = 0,
        x = 0,
        y = 0,
        x1 = Infinity,
        x2 = -Infinity,
        y1 = Infinity,
        y2 = -Infinity;

    while (buffer.pos < end) {
        if (!length) {
            var cmd_length = buffer.readVarint();
            cmd = cmd_length & 0x7;
            length = cmd_length >> 3;
        }

        length--;

        if (cmd === 1 || cmd === 2) {
            x += buffer.readSVarint();
            y += buffer.readSVarint();
            if (x < x1) x1 = x;
            if (x > x2) x2 = x;
            if (y < y1) y1 = y;
            if (y > y2) y2 = y;

        } else if (cmd !== 7) {
            throw new Error('unknown command ' + cmd);
        }
    }

    return [x1, y1, x2, y2];
};

},{"point-geometry":10}],9:[function(_dereq_,module,exports){
'use strict';

var VectorTileFeature = _dereq_('./vectortilefeature.js');

module.exports = VectorTileLayer;
function VectorTileLayer(buffer, end) {
    // Public
    this.version = 1;
    this.name = null;
    this.extent = 4096;
    this.length = 0;

    // Private
    this._buffer = buffer;
    this._keys = [];
    this._values = [];
    this._features = [];

    var val, tag;

    end = end || buffer.length;

    while (buffer.pos < end) {
        val = buffer.readVarint();
        tag = val >> 3;

        if (tag === 15) {
            this.version = buffer.readVarint();
        } else if (tag === 1) {
            this.name = buffer.readString();
        } else if (tag === 5) {
            this.extent = buffer.readVarint();
        } else if (tag === 2) {
            this.length++;
            this._features.push(buffer.pos);
            buffer.skip(val);

        } else if (tag === 3) {
            this._keys.push(buffer.readString());
        } else if (tag === 4) {
            this._values.push(this.readFeatureValue());
        } else {
            buffer.skip(val);
        }
    }
}

VectorTileLayer.prototype.readFeatureValue = function() {
    var buffer = this._buffer,
        value = null,
        bytes = buffer.readVarint(),
        end = buffer.pos + bytes,
        val, tag;

    while (buffer.pos < end) {
        val = buffer.readVarint();
        tag = val >> 3;

        if (tag == 1) {
            value = buffer.readString();
        } else if (tag == 2) {
            throw new Error('read float');
        } else if (tag == 3) {
            value = buffer.readDouble();
        } else if (tag == 4) {
            value = buffer.readVarint();
        } else if (tag == 5) {
            throw new Error('read uint');
        } else if (tag == 6) {
            value = buffer.readSVarint();
        } else if (tag == 7) {
            value = Boolean(buffer.readVarint());
        } else {
            buffer.skip(val);
        }
    }

    return value;
};

// return feature `i` from this layer as a `VectorTileFeature`
VectorTileLayer.prototype.feature = function(i) {
    if (i < 0 || i >= this._features.length) throw new Error('feature index out of bounds');

    this._buffer.pos = this._features[i];
    var end = this._buffer.readVarint() + this._buffer.pos;

    return new VectorTileFeature(this._buffer, end, this.extent, this._keys, this._values);
};

},{"./vectortilefeature.js":8}],10:[function(_dereq_,module,exports){
'use strict';

module.exports = Point;

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype = {
    clone: function() { return new Point(this.x, this.y); },

    add:     function(p) { return this.clone()._add(p);     },
    sub:     function(p) { return this.clone()._sub(p);     },
    mult:    function(k) { return this.clone()._mult(k);    },
    div:     function(k) { return this.clone()._div(k);     },
    rotate:  function(a) { return this.clone()._rotate(a);  },
    matMult: function(m) { return this.clone()._matMult(m); },
    unit:    function() { return this.clone()._unit(); },
    perp:    function() { return this.clone()._perp(); },
    round:   function() { return this.clone()._round(); },

    mag: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    equals: function(p) {
        return this.x === p.x &&
               this.y === p.y;
    },

    dist: function(p) {
        return Math.sqrt(this.distSqr(p));
    },

    distSqr: function(p) {
        var dx = p.x - this.x,
            dy = p.y - this.y;
        return dx * dx + dy * dy;
    },

    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    angleTo: function(b) {
        return Math.atan2(this.y - b.y, this.x - b.x);
    },

    angleWith: function(b) {
        return this.angleWithSep(b.x, b.y);
    },

    // Find the angle of the two vectors, solving the formula for the cross product a x b = |a||b|sin(θ) for θ.
    angleWithSep: function(x, y) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    },

    _matMult: function(m) {
        var x = m[0] * this.x + m[1] * this.y,
            y = m[2] * this.x + m[3] * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _add: function(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    },

    _sub: function(p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    },

    _mult: function(k) {
        this.x *= k;
        this.y *= k;
        return this;
    },

    _div: function(k) {
        this.x /= k;
        this.y /= k;
        return this;
    },

    _unit: function() {
        this._div(this.mag());
        return this;
    },

    _perp: function() {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    },

    _rotate: function(angle) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = cos * this.x - sin * this.y,
            y = sin * this.x + cos * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
};

// constructs Point from an array if necessary
Point.convert = function (a) {
    if (a instanceof Point) {
        return a;
    }
    if (Array.isArray(a)) {
        return new Point(a[0], a[1]);
    }
    return a;
};

},{}],11:[function(_dereq_,module,exports){

var Canvas = module.exports = function(options) {
  options = options || {};

  var
    canvas  = this._canvas  = document.createElement('CANVAS'),
    context = this._context = canvas.getContext('2d');

  canvas.width  = options.width  || options.size || 0;
  canvas.height = options.height || options.size || 0;
  canvas.style.width  = canvas.width  +'px';
  canvas.style.height = canvas.height +'px';

  context.mozImageSmoothingEnabled    = false;
  context.webkitImageSmoothingEnabled = false;
  context.imageSmoothingEnabled       = false;

  context.lineCap  = 'round';
  context.lineJoin = 'round';

  this._state = {};
};

var proto = Canvas.prototype;

proto.getDomElement = function() {
  return this._canvas;
};

proto.getContext = function() {
  return this._context;
};

proto.clear = function() {
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
};

proto.getData = function() {
  return this._context.getImageData(0, 0, this._canvas.width, this._canvas.height).data;
};

proto.drawCircle = function(x, y, size, strokeFillOrder) {
  this._beginBatch('circle', strokeFillOrder);
  this._context.moveTo(x+size, y);
  this._context.arc(x, y, size, 0, Math.PI*2);
};

proto.drawLine = function(coordinates) {
  this._beginBatch('line', 'S');
  var context = this._context;
  context.moveTo(coordinates[0], coordinates[1]);
  for (var i = 2, il = coordinates.length-1; i < il; i+=2) {
    context.lineTo(coordinates[i], coordinates[i+1]);
  }
};

proto.drawPolygon = function(coordinates, strokeFillOrder) {
  this._beginBatch('polygon', strokeFillOrder);

  var j, jl;
  var context = this._context;
  for (var i = 0, il = coordinates.length; i < il; i++) {
    context.moveTo(coordinates[i][0], coordinates[i][1]);
    for (j = 2, jl = coordinates[i].length-1; j < jl; j+=2) {
      context.lineTo(coordinates[i][j], coordinates[i][j+1]);
    }
  }
};

proto.drawText = function(text, x, y, align, stroke) {
  this._finishBatch();

  this.setStyle('textAlign', align);

  if (stroke) {
    this._context.strokeText(text, x, y);
  }

  this._context.fillText(text, x, y);
};

// TODO: rethink, whether a (newly) undefined value should cause this._finishBatch()
proto.setStyle = function(prop, value) {
  // checking for preset styles, for performance impacts see http://jsperf.com/osmb-context-props
  if (typeof value !== undefined && this._state[prop] !== value) {
    // finish previous stroke/fill operations, if any
    this._finishBatch();
    this._context[prop] = (this._state[prop] = value);
  }
};


proto._strokeFillMapping = {
  S: 'stroke',
  F: 'fill'
};

proto._beginBatch = function(operation, strokeFillOrder) {
// if (operation === 'polygon') console.log('BATCH', strokeFillOrder, this._state.fillStyle);

  if (this._operation === operation && this._strokeFillOrder === strokeFillOrder) {
    return;
  }
  this._finishBatch();
  this._operation = operation;
  this._strokeFillOrder = strokeFillOrder;
  this._context.beginPath();
};

proto._finishBatch = function() {
  if (!this._operation) {
    return;
  }

  var strokeFillOrder = this._strokeFillOrder;

  for (var i = 0, il = strokeFillOrder.length; i < il; i++) {
    this._context[ this._strokeFillMapping[ strokeFillOrder[i] ] ]();
  }

  this._operation = null;
  this._strokeFillOrder = null;
};

proto.setFont = function(size, face) {
  if (typeof size !== undefined || typeof face !== undefined) {
    size = size || this._state.fontSize;
    face = face || this._state.fontFace;
    if (this._state.fontSize !== size || this._state.fontFace !== face) {
      this._state.fontSize = size;
      this._state.fontFace = face;
      this._context.font = size +'px '+ face;
      return true;
    }
  }
};

proto.finishAll = function() {
  this._finishBatch();
};


/***
prop = props[i];
// careful, setter context.fillStyle = '#f00' but getter context.fillStyle === '#ff0000' also upper case, lower case...
//
// color parse (and probably other props) depends on canvas implementation so direct
// comparasions with context contents can't be done.
// use an extra object to store current state
// * chrome 35.0.1916.153:
// ctx.strokeStyle = 'rgba(0,0,0,0.1)'
// ctx.strokeStyle -> "rgba(0, 0, 0, 0.09803921568627451)"
// * ff 29.0.1
// ctx.strokeStyle = 'rgba(0,0,0,0.1)'
// ctx.strokeStyle -> "rgba(0, 0, 0, 0.1)"
***/

},{}],12:[function(_dereq_,module,exports){

var Core = module.exports = {};

Core.load = function(url, type, onSuccess, onError) {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
      return;
    }

    if (!xhr.status || xhr.status < 200 || xhr.status > 299) {
      if (onError) {
        onError(xhr);
      }
      return;
    }

    if (onSuccess) {
      onSuccess(xhr.response);
    }
  };

  xhr.responseType = type;
  xhr.open('GET', url, true);
  xhr.send(null);
  return xhr;
};

},{}],13:[function(_dereq_,module,exports){

var Events = module.exports = function() {
  this._listeners = {};
};

var proto = Events.prototype;

proto.on = function(type, listener, scope) {
  var listeners = this._listeners[type] || (this._listeners[type] = []);
  listeners.push(function(payload) {
    listener.call(scope, payload);
  });
  return this;
};

proto.emit = function(type, payload) {
  if (!this._listeners[type]) {
    return;
  }
  var listeners = this._listeners[type];
  for (var i = 0, il = listeners.length; i < il; i++) {
    listeners[i](payload);
  }
};

},{}],14:[function(_dereq_,module,exports){

var Geometry = module.exports = {};

Geometry.POINT   = 'Point';
Geometry.LINE    = 'LineString';
Geometry.POLYGON = 'Polygon';

var proto = Geometry;

proto.getCentroid = function(featureParts) {
  var part, coordinates, tileX, tileY;

  if (!featureParts || !featureParts.length) {
    return;
  }

  if (featureParts.length === 1) {
    part = featureParts[0];
  } else {
    part = getLargestPart(featureParts);
  }

  if (!part) {
    return;
  }

  coordinates = part.feature.coordinates;
  tileX = part.tileCoords.x*part.tileSize;
  tileY = part.tileCoords.y*part.tileSize;

  if (part.feature.type === Geometry.POINT) {
    return {
      x: coordinates[0] + tileX,
      y: coordinates[1] + tileY
    };
  }

  if (part.feature.type === Geometry.POLYGON) {
    coordinates = coordinates[0];
  }

  var
    startX = coordinates[0], startY = coordinates[1],
    xTmp = 0, yTmp = 0,
    dx0, dy0,
    dx1, dy1,
    len, lenSum = 0;

  for (var i = 0, il = coordinates.length-3; i < il; i+=2) {
    dx0 = coordinates[i  ]-startX;
    dy0 = coordinates[i+1]-startY;
    dx1 = coordinates[i+2]-startX;
    dy1 = coordinates[i+3]-startY;

    len = dx0*dy1 - dx1*dy0;

    lenSum += len;
    xTmp += (dx1+dx0) * len;
    yTmp += (dy1+dy0) * len;
  }

  if (lenSum) {
    return {
      x: (xTmp/(3*lenSum)) + startX + tileX,
      y: (yTmp/(3*lenSum)) + startY + tileY
    };
  }

  return {
    x: startX + tileX,
    y: startY + tileY
  };
};

function getBBox(coordinates) {
  var
    min = Math.min,
    max = Math.max,
    minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (var i = 0, il = coordinates.length-1; i < il; i+=2) {
    minX = min(minX, coordinates[i]);
    maxX = max(maxX, coordinates[i]);
    minY = min(minY, coordinates[i+1]);
    maxY = max(maxY, coordinates[i+1]);
  }

  return { minX:minX, minY:minY, maxX:maxX, maxY:maxY };
}

function getArea(coordinates) {
  if (coordinates.length < 6) {
    return 0;
  }
  var sum = 0;
  for (var i = 0, il = coordinates.length-3; i < il; i+=2) {
    sum += (coordinates[i+2]-coordinates[i]) * (coordinates[i+1]+coordinates[i+3]);
  }
  sum += (coordinates[0]-coordinates[il]) * (coordinates[il+1]+coordinates[1]);
  return -sum/2;
}

function getLargestPart(featureParts) {
  var
    area, maxArea = -Infinity,
    part, maxPart,
    coordinates;

  for (var i = 0, il = featureParts.length; i < il; i++) {
    part = featureParts[i];
    coordinates = part.feature.coordinates;

    if (part.feature.type === Geometry.POLYGON) {
      coordinates = coordinates[0];
    }

    area = getArea(coordinates);

    if (area > maxArea) {
      maxArea = area;
      maxPart = part;
    }
  }

  return maxPart;
}

},{}],15:[function(_dereq_,module,exports){

var Geometry = _dereq_('./geometry');

// do this only when Leaflet exists (aka don't when run in web worker)
if (typeof L !== 'undefined') {
  var Tile = _dereq_('./tile');
  var Profiler = _dereq_('./profiler');

  var Layer = module.exports = L.TileLayer.extend({

    options: {
      maxZoom: 22
    },

    _qTree: {},

    _renderQueue: [],

    initialize: function(options) {
      // applies to a single tile but we don't want to check on per tile basis
      if (!options.provider) {
        throw new Error('VECNIK.Tile requires a data provider');
      }
      this._provider = options.provider;

      // applies to a single tile but we don'T want to check on per tile basis
      if (!options.renderer) {
        throw new Error('VECNIK.Tile requires a renderer');
      }
      this._renderer = options.renderer;

      this._tileObjects = {};
      this._centroidPositions = {};

      var self = this;
      var lazyRender = function() {
        if (self._renderQueue.length) {
          var
            key = self._renderQueue[ self._renderQueue.length-1 ],
            tiles = self._tileObjects[self._map.getZoom()];

          if (tiles[key]) {
            tiles[key].render();
          }

          self._renderQueue.pop();
        }
      };
      setInterval(function() {
        requestAnimationFrame(lazyRender);
      }, 33);

      L.TileLayer.prototype.initialize.call(this, '', options);
    },

    addBBox: function(type, bbox) {
      (this._qTree[type] || (this._qTree[type] = [])).push(bbox);
    },

    hasCollision: function(type, bbox) {
      var
        minX = bbox.x,
        maxX = minX+bbox.w,
        minY = bbox.y,
        maxY = minY+bbox.h,
        qTree = this._qTree[type] || (this._qTree[type] = []),
        item;

      for (var i = 0, il = qTree.length; i < il; i++) {
        item = qTree[i];
        if (item.id === bbox.id) {
          return false;
        }
        if (minX < item.x+item.w && minY < item.y+item.h && maxX > item.x && maxY > item.y) {
          return true;
        }
      }
      return false;
    },

    _getFeaturePropertiesFromPos: function(pos) {
      var tileSize = this._getTileSize();
      var tile = { x: (pos.x/tileSize) | 0, y: (pos.y/tileSize) | 0 };
      var key = this._tileCoordsToKey(tile);
      var tileX = pos.x - tileSize*tile.x;
      var tileY = pos.y - tileSize*tile.y;
      var tiles = this._tileObjects[this._map.getZoom()];

      if (!tiles[key]) {
        return null;
      }

      return tiles[key].getFeatureAt(tileX, tileY);
    },

    _getTileFromPos: function(pos) {
      var tileSize = this._getTileSize();
      var tile = { x: (pos.x/tileSize) | 0, y: (pos.y/tileSize) | 0 };
      var key = this._tileCoordsToKey(tile);
      return this._tiles[key];
    },

    _addToRenderQueue: function(key, withPriority) {
      var index = this._renderQueue.indexOf(key);

      if (index > -1) {
        if (withPriority) {
          // remove earlier duplicate
          this._renderQueue.splice(index, 1);
        } else {
          // keep later duplicate and don't do anything
          return;
        }
      }

      this._renderQueue[withPriority ? 'push' : 'unshift'](key);
    },

    _renderAffectedTiles: function(cartodb_id) {
      var tiles = this._tileObjects[this._map.getZoom()];
      requestAnimationFrame(function() {
        for (var key in tiles) {
          if (!!tiles[key].getFeature(cartodb_id)) {
            tiles[key].render();
          }
        }
      });
    },

    _hoveredFeatureProperties: null,
    _clickedFeatureProperties: null,

    onAdd: function(map) {
console.log('Retina: '+ L.Browser.retina +' Tile size: '+ this._getTileSize());

      map.on('mousedown', function (e) {
        if (!this.options.interaction) {
          return;
        }

        // render previously highlighted tiles as normal
        if (this._clickedFeatureProperties) {
          this._renderAffectedTiles(this._clickedFeatureProperties.cartodb_id);
        }

        this._clickedFeatureProperties = this._getFeaturePropertiesFromPos(map.project(e.latlng));

        if (this._clickedFeatureProperties) {
          this._renderAffectedTiles(this._clickedFeatureProperties.cartodb_id);

          this.fireEvent('featureClick', {
            feature: this._clickedFeatureProperties,
            geo: e.latlng,
            x: e.originalEvent.x,
            y: e.originalEvent.y
          });
        }
      }, this);

      map.on('mousemove', function (e) {
        if (!this.options.interaction) {
          return;
        }

        var pos = map.project(e.latlng);
        var tile = this._getTileFromPos(pos);
        var feature = this._getFeaturePropertiesFromPos(pos);

        var payload = {
          geo: e.latlng,
          x: e.originalEvent.x,
          y: e.originalEvent.y
        };

        // mouse stays in same feature
        if (feature && this._hoveredFeatureProperties && feature.cartodb_id === this._hoveredFeatureProperties.cartodb_id) {
          payload.feature = this._hoveredFeatureProperties;
          this.fireEvent('featureOver', payload);
          return;
        }

        // mouse just left a feature
        if (this._hoveredFeatureProperties) {
          this._renderAffectedTiles(this._hoveredFeatureProperties.cartodb_id);
          if (tile) {
            tile.style.cursor = 'inherit';
          }
          payload.feature = this._hoveredFeatureProperties;
          this.fireEvent('featureLeave', payload);
          this._hoveredFeatureProperties = null;
          return;
        }

        // mouse is outside any feature
        if (!feature) {
          delete payload.feature;
          this.fireEvent('featureOut', payload);
          return;
        }

        // mouse entered another feature
        this._hoveredFeatureProperties = feature;
        this._renderAffectedTiles(this._hoveredFeatureProperties.cartodb_id);
        if (tile) {
          tile.style.cursor = 'pointer';
        }
        payload.feature = feature;
        this.fireEvent('featureEnter', payload);
      }, this);


      map.on('zoomend', function (e) {
        this._qTree = {};
      }, this);

      return L.TileLayer.prototype.onAdd.call(this, map);
    },

    _removeTile: function(key) {
      delete this._tileObjects[this._map.getZoom()][key];
      L.TileLayer.prototype._removeTile.call(this, key);
    },

    createTile: function(coords) {
      var tile = new Tile({
        size: this._getTileSize(),
        coords: coords,
        layer: this,
        provider: this._provider,
        renderer: this._renderer
      });

      var
        key = this._tileCoordsToKey(coords),
        zoom = this._map.getZoom();

      (this._tileObjects[zoom] || (this._tileObjects[zoom] = []))[key] = tile;

      return tile.getDomElement();
    },

    redraw: function(forceReload) {
      this._renderQueue = [];
      this._qTree = {};

      if (!!forceReload) {
        this._centroidPositions = {};
        L.TileLayer.prototype.redraw.call(this);
        return this;
      }

      var timer = Profiler.metric('tiles.render.time').start();

      // get viewport tile bounds in order to render immediately, when visible
      var
        mapBounds = this._map.getPixelBounds(),
        tileSize = this._getTileSize(),
        tileBounds = L.bounds(
          mapBounds.min.divideBy(tileSize).floor(),
          mapBounds.max.divideBy(tileSize).floor()
        ),
        tiles = this._tileObjects[this._map.getZoom()];

      for (var key in tiles) {
        this._addToRenderQueue(key, tileBounds.contains(this._keyToTileCoords(key)));
      }

      timer.end();

      return this;
    },

    getCentroid: function(feature) {
      var
        scale = Math.pow(2, this._map.getZoom()),
        pos;

      if (pos = this._centroidPositions[feature.id]) {
        return { x: pos.x*scale <<0, y: pos.y*scale <<0 };
      }

      var featureParts = this._getFeaturePropertiesParts(feature.id);
      if (pos = Geometry.getCentroid(featureParts)) {
        this._centroidPositions[feature.id] = { x: pos.x/scale, y: pos.y/scale };
        return pos;
      }
    },

    _getFeaturePropertiesParts: function(id) {
      var
        tiles = this._tileObjects[this._map.getZoom()],
        tile,
        feature, f, fl,
        featureParts = [];

      for (var key in tiles) {
        tile = tiles[key];
        for (f = 0, fl = tile._data.length; f < fl; f++) {
          feature = tile._data[f];
          if (feature.id === id) {
            featureParts.push({ feature: feature, tileCoords: tile.getCoords(), tileSize: tile.getSize() });
          }
        }
      }
      return featureParts;
    },

    setInteraction: function(flag) {
      this.options.interaction = !!flag;
      return this;
    },

    getHoveredFeature: function() {
      return this._hoveredFeatureProperties;
    },

    getClickedFeature: function() {
      return this._clickedFeatureProperties;
    }
  });
}

},{"./geometry":14,"./profiler":18,"./tile":27}],16:[function(_dereq_,module,exports){
(function (global){

(function(global) {
  global.requestAnimationFrame = global.requestAnimationFrame ||
    global.mozRequestAnimationFrame ||
    global.webkitRequestAnimationFrame ||
    global.msRequestAnimationFrame ||
    function(callback) {
      return global.setTimeout(callback, 16);
    };

  global.Int32Array = global.Int32Array || global.Array,
  global.Uint8Array = global.Uint8Array || global.Array;

  if (!global.console) {
    global.console = {};
  }

}(self || window || global));

var VECNIK = _dereq_('./core/core');

VECNIK.Geometry    = _dereq_('./geometry');
VECNIK.Canvas      = _dereq_('./canvas');
VECNIK.CartoShader = _dereq_('./shader');
VECNIK.CartoShaderLayer = _dereq_('./shader.layer');
VECNIK.Renderer    = _dereq_('./renderer');

// Providers
VECNIK.CartoDB     = _dereq_('./provider/cartodb');
VECNIK.TMS         = _dereq_('./provider/tms');

// Readers
VECNIK.GeoJSON     = _dereq_('./reader/geojson');
VECNIK.VectorTile  = _dereq_('./reader/vectortile');

VECNIK.Layer       = _dereq_('./layer');
VECNIK.Profiler    = _dereq_('./profiler');
module.exports = VECNIK;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./canvas":11,"./core/core":12,"./geometry":14,"./layer":15,"./profiler":18,"./provider/cartodb":19,"./provider/tms":21,"./reader/geojson":22,"./reader/vectortile":23,"./renderer":24,"./shader":25,"./shader.layer":26}],17:[function(_dereq_,module,exports){

var Tile = _dereq_('./tile');

var Point = function(x, y) {
  this.x = x || 0;
  this.y = y || 0;
};

function clamp(value, optMin, optMax) {
  if (optMin !== null) value = Math.max(value, optMin);
  if (optMax !== null) value = Math.min(value, optMax);
  return value;
}

function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
  return rad / (Math.PI / 180);
}


var MercatorProjection = module.exports = function() {
//  this._tileSize = L.Browser.retina ? 512 : 256;
  this._tileSize = 256;
  this._pixelOrigin = new Point(this._tileSize / 2, this._tileSize / 2);
  this._pixelsPerLonDegree = this._tileSize / 360;
  this._pixelsPerLonRadian = this._tileSize / (2 * Math.PI);
};

MercatorProjection.prototype._fromLatLonToPoint = function(lat, lon) {
  var point = new Point(0, 0);
  var origin = this._pixelOrigin;

  point.x = origin.x + lon * this._pixelsPerLonDegree;

  // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
  // 89.189.  This is about a third of a tile past the edge of the world
  // tile.
  var siny = clamp(Math.sin(degreesToRadians(lat)), -0.9999, 0.9999);
  point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -this._pixelsPerLonRadian;
  return point;
};

MercatorProjection.prototype._fromPointToLatLon = function(point) {
  var me = this;
  var origin = me._pixelOrigin;
  var lon = (point.x - origin.x) / me._pixelsPerLonDegree;
  var latRadians = (point.y - origin.y) / -me._pixelsPerLonRadian;
  var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
  return { lat:lat, lon:lon };
};

MercatorProjection.prototype._tilePixelPos = function(tileX, tileY) {
  return {
    x: tileX*this._tileSize,
    y: tileY*this._tileSize
  };
};

MercatorProjection.prototype.tileBBox = function(x, y, zoom, bufferSize) {
  var numTiles = 1 <<zoom;
  bufferSize = bufferSize || 0;
  var inc =  (this._tileSize + bufferSize*2)/numTiles;
  var px = (x*this._tileSize - bufferSize  )/numTiles;
  var py = (y*this._tileSize - bufferSize  )/numTiles;
  return [
    this._fromPointToLatLon(new Point(px, py + inc)),
    this._fromPointToLatLon(new Point(px + inc, py))
  ];
};

MercatorProjection.prototype.latLonToTilePoint = function(lat, lon, tileX, tileY, zoom) {
  var numTiles = 1 <<zoom;
  var worldCoordinate = this._fromLatLonToPoint(lat, lon);
  var pixelCoordinate = new Point(worldCoordinate.x*numTiles, worldCoordinate.y*numTiles);
  var tilePixelPos    = this._tilePixelPos(tileX, tileY);
  return new Point(Math.round(pixelCoordinate.x-tilePixelPos.x), Math.round(pixelCoordinate.y-tilePixelPos.y));
};

},{"./tile":27}],18:[function(_dereq_,module,exports){
/*
# metrics profiler

## timing

```
 var timer = Profiler.metric('resource:load')
 time.start();
 ...
 time.end();
```

## counters

```
 var counter = Profiler.metric('requests')
 counter.inc();   // 1
 counter.inc(10); // 11
 counter.dec()    // 10
 counter.dec(10)  // 0
```

## Calls per second
```
  var fps = Profiler.metric('fps')
  function render() {
    fps.mark();
  }
```
*/

var MAX_HISTORY = 1024;
function Profiler() {}
Profiler.metrics = {};

Profiler.get = function(name) {
  return Profiler.metrics[name] || {
    max: 0,
    min: Number.MAX_VALUE,
    avg: 0,
    total: 0,
    count: 0,
    history: typeof(Float32Array) !== 'undefined' ? new Float32Array(MAX_HISTORY) : []
  };
};

Profiler.new_value = function (name, value) {
  var t = Profiler.metrics[name] = Profiler.get(name);

  t.max = Math.max(t.max, value);
  t.min = Math.min(t.min, value);
  t.total += value;
  ++t.count;
  t.avg = t.total / t.count;
  t.history[t.count%MAX_HISTORY] = value;
};

Profiler.print_stats = function () {
  for (var k in Profiler.metrics) {
    var t = Profiler.metrics[k];
    console.log(" === " + k + " === ");
    console.log(" max: " + t.max);
    console.log(" min: " + t.min);
    console.log(" avg: " + t.avg);
    console.log(" count: " + t.count);
    console.log(" total: " + t.total);
  }
};

function Metric(name) {
  this.t0 = null;
  this.name = name;
  this.count = 0;
}

Metric.prototype = {

  //
  // start a time measurement
  //
  start: function() {
    this.t0 = +new Date();
    return this;
  },

  // elapsed time since start was called
  _elapsed: function() {
    return +new Date() - this.t0;
  },

  //
  // finish a time measurement and register it
  // ``start`` should be called first, if not this
  // function does not take effect
  //
  end: function() {
    if (this.t0 !== null) {
      Profiler.new_value(this.name, this._elapsed());
      this.t0 = null;
    }
  },

  //
  // increments the value
  // qty: how many, default = 1
  //
  inc: function(qty) {
    qty = qty === undefined ? 1: qty;
    Profiler.new_value(this.name, Profiler.get(this.name).count + (qty ? qty: 0));
  },

  //
  // decrements the value
  // qty: how many, default = 1
  //
  dec: function(qty) {
    qty = qty === undefined ? 1: qty;
    this.inc(-qty);
  },

  //
  // measures how many times per second this function is called
  //
  mark: function() {
    ++this.count;
    if(this.t0 === null) {
      this.start();
      return;
    }
    var elapsed = this._elapsed();
    if(elapsed > 1) {
      Profiler.new_value(this.name, this.count);
      this.count = 0;
      this.start();
    }
  }
};

Profiler.metric = function(name) {
  return new Metric(name);
};

module.exports = Profiler;


},{}],19:[function(_dereq_,module,exports){

var CartoDB = module.exports = {};

CartoDB.SQL = _dereq_('./cartodb.sql').SQL;

CartoDB.API = function(reader, options) {
  if (!reader) {
    throw new Error('Provider requires a Reader');
  }
  this._reader = reader;
  this.update(options);
};

var proto = CartoDB.API.prototype;

proto._debug = function(msg) {
  if (this._options.debug) {
    console.log(msg);
  }
};

proto._getUrl = function(coords) {
  var sql = CartoDB.SQL(this._options.table, coords.x, coords.y, coords.z, this._options);
  this._debug(sql);
  return this._baseUrl +'?q='+ encodeURIComponent(sql) +'&format=geojson&dp=6';
};

proto.load = function(tile, callback) {
  this._reader.load(this._getUrl(tile), tile, callback);
};

proto.update = function(options) {
  this._options = options;
  this._baseUrl = 'http://'+ options.user +'.cartodb.com/api/v2/sql';

// this is how cdn would be handled
//  this._baseUrl = 'http://3.ashbu.cartocdn.com/' + options.user +'/api/v1/sql';

  if (this._options.ENABLE_SIMPLIFY === undefined) {
    this._options.ENABLE_SIMPLIFY = true;
  }
  if (this._options.ENABLE_SNAPPING === undefined) {
    this._options.ENABLE_SNAPPING = true;
  }
  if (this._options.ENABLE_CLIPPING === undefined) {
    this._options.ENABLE_CLIPPING = true;
  }
  if (this._options.ENABLE_FIXING === undefined) {
    this._options.ENABLE_FIXING = true;
  }
};

},{"./cartodb.sql":20}],20:[function(_dereq_,module,exports){

var Mercator = _dereq_('../mercator');

var CartoDB = module.exports = {};

CartoDB.SQL = function(table, x, y, zoom, options) {

  options = options || {
    ENABLE_SIMPLIFY: true,
    ENABLE_CLIPPING: true,
    ENABLE_SNAPPING: true,
    ENABLE_FIXING:   true
  };

  var projection = new Mercator();
  var bbox = projection.tileBBox(x, y, zoom, options.bufferSize);
  var geom_column = '"the_geom"';
  var geom_column_orig = '"the_geom"';
  var id_column = '"cartodb_id"';

  var tileSize = 256; // = L.Browser.retina ? 512 : 256;
  var tile_pixel_width = tileSize;
  var tile_pixel_height = tileSize;

  //console.log('-- ZOOM: ' + zoom);

  var tile_geo_width  = bbox[1].lon - bbox[0].lon;
  var tile_geo_height = bbox[1].lat - bbox[0].lat;

  var pixel_geo_width  = tile_geo_width  / tile_pixel_width;
  var pixel_geo_height = tile_geo_height / tile_pixel_height;

  //console.log('-- PIXEL_GEO_SIZE: '
  //  + pixel_geo_width + ' x ' + pixel_geo_height);

  var pixel_geo_maxsize = Math.max(pixel_geo_width, pixel_geo_height);
  //console.log('-- MAX_SIZE: ' + pixel_geo_maxsize);

  var tolerance = pixel_geo_maxsize / 2;
  //console.log('-- TOLERANCE: ' + tolerance);

  // simplify
  if (options.ENABLE_SIMPLIFY) {
    geom_column = 'ST_Simplify('+ geom_column +', '+ tolerance +')';
    // may change type
    geom_column = 'ST_CollectionExtract('+ geom_column +', ST_Dimension('+ geom_column_orig +') + 1)';
  }

  // snap to a pixel grid
  if (options.ENABLE_SNAPPING ) {
    geom_column = 'ST_SnapToGrid('+ geom_column +', '+ pixel_geo_maxsize +')';
    // may change type
    geom_column = 'ST_CollectionExtract('+ geom_column +', ST_Dimension('+ geom_column_orig +') + 1)';
  }

  // This is the query bounding box
  var sql_env = 'ST_MakeEnvelope('+
    bbox[0].lon +','+ bbox[0].lat +','+
    bbox[1].lon +','+ bbox[1].lat +', 4326)';

  var filter = 'the_geom && '+ sql_env;

  if (options.filter) {
    filter += ' AND '+ options.filter;
  }

  // clip
  if (options.ENABLE_CLIPPING) {
    // This is a slightly enlarged version of the query bounding box

    // var sql_env_exp = '('+ sql_env +')';
    var sql_env_exp = 'ST_Expand('+ sql_env +', '+ (pixel_geo_maxsize*120) +')';

    // Also must be snapped to the grid ...
    sql_env_exp = 'ST_SnapToGrid('+ sql_env_exp +','+ pixel_geo_maxsize +')';

    // snap to box
    geom_column = 'ST_Snap('+ geom_column +', '+ sql_env_exp +', '+ pixel_geo_maxsize +')';

    // Make valid (both ST_Snap and ST_SnapToGrid and ST_Expand
    if (options.ENABLE_FIXING) {
      // NOTE: up to PostGIS-2.0.0 beta5 ST_MakeValid did not accept
      //       points nor GeometryCollection objects
      geom_column = 'CASE WHEN ST_Dimension('+
        geom_column +') = 0 OR GeometryType('+
        geom_column +") = 'GEOMETRYCOLLECTION' THEN "+
        geom_column +' ELSE ST_CollectionExtract(ST_MakeValid('+
        geom_column +'), ST_Dimension(' + geom_column_orig +
        ') + 1) END';
    }

    // clip by box
    geom_column = 'ST_Intersection('+ geom_column +', '+ sql_env_exp +')';
  }

  var columns = id_column +','+ geom_column +' as the_geom';
  if (options.columns) {
    columns += ','+ options.columns.join(',') +' ';
  }

  // profiling only
  if (options.COUNT_ONLY) {
    columns = x +' AS x, '+ y +' AS y, SUM(st_npoints('+ geom_column +')) AS the_geom';
  }

  return 'SELECT '+ columns +' FROM '+ table +' WHERE '+ filter; // +' LIMIT 100';
};

},{"../mercator":17}],21:[function(_dereq_,module,exports){

var Projection = _dereq_('../mercator');

var TMS = module.exports = function(template, reader) {
  this._template = template;

  if (!reader) {
    throw new Error('Provider requires a reader');
  }
  this._reader = reader;
};

var proto = TMS.prototype;

proto._getUrl = function(coords) {
  return this._template
    .replace('{z}', coords.z.toFixed(0))
    .replace('{x}', coords.x.toFixed(0))
    .replace('{y}', coords.y.toFixed(0));
};

proto.load = function(tile, callback) {
  this._reader.load(this._getUrl(tile), tile, callback);
};

proto.update = function() {};

},{"../mercator":17}],22:[function(_dereq_,module,exports){

var VECNIK = _dereq_('../core/core');
var Geometry = _dereq_('../geometry');
var Mercator = _dereq_('../mercator');

var projection = new Mercator();

function _addPoint(coordinates, id, properties, tile, dataByRef) {
  dataByRef.push({
    id: id,
    type: Geometry.POINT,
    coordinates: _toBuffer([coordinates], tile),
    properties: properties
  });
}

function _addLineString(coordinates, id, properties, tile, dataByRef) {
  dataByRef.push({
    id: id,
    type: Geometry.LINE,
    coordinates: _toBuffer(coordinates, tile),
    properties: properties
  });
}

function _addPolygon(coordinates, id, properties, tile, dataByRef) {
  var rings = [];
  for (var i = 0, il = coordinates.length; i < il; i++) {
    rings.push(_toBuffer(coordinates[i], tile));
  }
  dataByRef.push({
    id: id,
    type: Geometry.POLYGON,
    coordinates: rings,
    properties: properties
  });
}

function _convertAndReproject(collection, tile) {
  var dataByRef = [], feature;

  for (var i = 0, il = collection.features.length; i < il; i++) {
    feature = collection.features[i];

    if (!feature.geometry) {
      continue;
    }

    _addGeometry(
      feature.geometry,
      feature.id || feature.properties.id || feature.properties.cartodb_id,
      feature.properties,
      tile,
      dataByRef
    );
  }

  return dataByRef;
}

function _addGeometry(geometry, id, properties, tile, dataByRef) {
  var i, il, coordinates = geometry.coordinates;

  switch (geometry.type) {
    case 'Point':
      _addPoint(coordinates, id, properties, tile, dataByRef);
    break;

    case 'MultiPoint':
      for (i = 0, il = coordinates.length; i < il; i++) {
        _addPoint(coordinates[i], id, _clone(properties), tile, dataByRef);
      }
    break;

    case 'LineString':
      _addLineString(coordinates, id, properties, tile, dataByRef);
    break;

    case 'MultiLineString':
      for (i = 0, il = coordinates.length; i < il; i++) {
        _addLineString(coordinates[i], _clone(properties), tile, dataByRef);
      }
    break;

    case 'Polygon':
      _addPolygon(coordinates, id, properties, tile, dataByRef);
    break;

    case 'MultiPolygon':
      for (i = 0, il = coordinates.length; i < il; i++) {
        _addPolygon(coordinates[i], id, _clone(properties), tile, dataByRef);
      }
    break;

    case 'GeometryCollection':
      var geometries = geometry.geometries;
      for (i = 0, il = geometries.length; i < il; i++) {
        _addGeometry(
          geometries[i],
          id,
          _clone(properties),
          tile,
          dataByRef
        );
      }
    break;
  }
}

function _toBuffer(coordinates, tile) {
  var
    len = coordinates.length,
    point,
    buffer = new Int16Array(len*2);

  for (var i = 0; i < len; i++) {
    point = projection.latLonToTilePoint(coordinates[i][1], coordinates[i][0], tile.x, tile.y, tile.z);
    buffer[i*2  ] = point.x;
    buffer[i*2+1] = point.y;
  }
  return buffer;
}

function _clone(obj) {
  var
    keys = Object.keys(obj),
    res = {};
  for (var i = 0, il = keys.length; i < il; i++) {
    res[keys[i]] = obj[keys[i]];
  }
  return res;
}

var GeoJSON = module.exports = {};

GeoJSON.load = function(url, tile, callback) {
//  if (!GeoJSON.WEBWORKERS || typeof Worker === undefined) {
  if (typeof Worker === undefined) {
    VECNIK.load(url, 'json', function(collection) {
      callback(_convertAndReproject(collection, tile));
    });
  } else {
    var worker = new Worker('../src/reader/geojson.worker.js');
    worker.onmessage = function(e) {
      callback(e.data);
    };

    worker.postMessage({ url: url, tile: tile });
  }
};

GeoJSON.convertForWorker = function(collection, tile) {
  return _convertAndReproject(collection, tile);
};

},{"../core/core":12,"../geometry":14,"../mercator":17}],23:[function(_dereq_,module,exports){

var VECNIK = _dereq_('../core/core');
var Geometry = _dereq_('../geometry');

var PBF = _dereq_('pbf');
var VT = _dereq_('vector-tile').VectorTile;

function _addPoint(coordinates, id, properties, dataByRef) {
  dataByRef.push({
    id: id,
    type: Geometry.POINT,
    coordinates: _toBuffer(coordinates[0]),
    properties: properties
  });
}

function _addLineString(coordinates, id, properties, dataByRef) {
  dataByRef.push({
    id: id,
    type: Geometry.LINE,
    coordinates: _toBuffer(coordinates[0]),
    properties: properties
  });
}

function _addPolygon(coordinates, id, properties, dataByRef) {
  var rings = [];
  for (var i = 0, il = coordinates.length; i < il; i++) {
    rings.push(_toBuffer(coordinates[i]));
  }
  dataByRef.push({
    id: id,
    type: Geometry.POLYGON,
    coordinates: rings,
    properties: properties
  });
}

function _convertAndReproject(buffer) {
  buffer = new PBF(new Uint8Array(buffer));

  var vTile = new VT(buffer);
  var f, numFeatures;
  var dataByRef = [], feature;

  for (var l in vTile.layers) {
    numFeatures = vTile.layers[l].length;

    for (f = 0; f < numFeatures; f++) {
      feature = vTile.layers[l].feature(f);

      // Mapbox specific
      feature.properties.cartodb_id = feature.properties.osm_id || Math.random() * 100000 <<0;

      _addGeometry(
        feature.type,
        feature.loadGeometry(),
        feature.id || feature.properties.id || feature.properties.cartodb_id,
        feature.properties,
        dataByRef
      );
    }
  }

  return dataByRef;
}

function _addGeometry(geometryType, coordinates, id, properties, dataByRef) {
  switch (geometryType) {
    case 1: // Point
      _addPoint(coordinates, id, properties, dataByRef);
    break;

    case 2: // LineString
      _addLineString(coordinates, id, properties, dataByRef);
    break;

    case 3: // Polygon
      _addPolygon(coordinates, id, properties, dataByRef);
    break;
  }
}

function _toBuffer(coordinates) {
  var
    len = coordinates.length,
    buffer = new Int16Array(len*2);

  for (var i = 0; i < len; i++) {
    buffer[i*2  ] = coordinates[i].x >>4;
    buffer[i*2+1] = coordinates[i].y >>4;
  }

  return buffer;
}

var VectorTile = module.exports = {};

VectorTile.load = function(url, tile, callback) {
//  if (!VectorTile.WEBWORKERS || typeof Worker === undefined) {
  if (typeof Worker === undefined) {
    VECNIK.load(url, 'arraybuffer', function(buffer) {
      callback(_convertAndReproject(buffer));
    });
  } else {
    var worker = new Worker('../src/reader/vectortile.worker.js');
    worker.onmessage = function(e) {
      callback(e.data);
    };

    worker.postMessage({ url: url });
  }
};

VectorTile.convertForWorker = function(buffer) {
  return _convertAndReproject(buffer);
};

},{"../core/core":12,"../geometry":14,"pbf":4,"vector-tile":6}],24:[function(_dereq_,module,exports){

var Shader = _dereq_('./shader');
var Geometry = _dereq_('./geometry');

function getStrokeFillOrder(shadingOrder) {
  var
    symbolizer,
    res = '';
  for (var i = 0, il = shadingOrder.length; i < il; i++) {
    symbolizer = shadingOrder[i];
    if (symbolizer === Shader.POLYGON) {
      res += 'F';
    }
    if (symbolizer === Shader.LINE) {
      res += 'S';
    }
  }
  return res;
}

var Renderer = module.exports = function(options) {
  options = options || {};
  if (!options.shader) {
    throw new Error('VECNIK.Renderer requires a shader');
  }

  this._shader = options.shader;
};

var proto = Renderer.prototype;

proto.setShader = function(shader) {
  this._shader = shader;
};

proto.getShader = function() {
  return this._shader;
};

// render the specified collection in the contenxt
// mapContext contains the data needed for rendering related to the
// map state, for the moment only zoom
proto.render = function(tile, canvas, collection, mapContext) {
  var
    layer = tile.getLayer(),
    tileCoords = tile.getCoords(),
    tileSize = tile.getSize(),
    layers = this._shader.getLayers(),
    collection,
    shaderLayer, style,
    shadingOrder, symbolizer,
    strokeFillOrder,
    i, il, r, rl, s, sl,
    feature, coordinates,
		pos,
    radius, bbox, hasCollision;

  canvas.clear();

  // for render order see https://gist.github.com/javisantana/7843f292ecf47f74a27d

  for (s = 0, sl = layers.length; s < sl; s++) {
    shaderLayer = layers[s];
    shadingOrder = shaderLayer.getShadingOrder();
    strokeFillOrder = getStrokeFillOrder(shadingOrder);

    for (r = 0, rl = shadingOrder.length; r < rl; r++) {
      symbolizer = shadingOrder[r];

      for (i = 0, il = collection.length; i < il; i++) {
        feature = collection[i];
        coordinates = feature.coordinates;

        style = shaderLayer.getStyle(feature.properties, mapContext);
        switch (symbolizer) {
          case Shader.POINT:
            if ((pos = layer.getCentroid(feature)) && style.markerSize && style.markerFill) {
              radius = style.markerSize;
              bbox = { id: feature.id, x: pos.x-radius, y: pos.y-radius, w: radius*2, h: radius*2 };
              hasCollision = !style.markerAllowOverlap && layer.hasCollision(symbolizer, bbox);

              if (!hasCollision) {
                canvas.setStyle('strokeStyle', style.markerLineColor);
                canvas.setStyle('lineWidth',   style.markerLineWidth);
                canvas.setStyle('fillStyle',   style.markerFill);
                canvas.drawCircle(pos.x - tileCoords.x*tileSize, pos.y - tileCoords.y*tileSize, radius, 'FS' /*strokeFillOrder*/);

                layer.addBBox(symbolizer, bbox);
              }
            }
          break;

          case Shader.LINE:
            if (style.lineColor) {
              if (feature.type === Geometry.POLYGON) {
                coordinates = coordinates[0];
              }

              canvas.setStyle('strokeStyle', style.lineColor);
              canvas.setStyle('lineWidth',   style.lineWidth);

              canvas.drawLine(coordinates);
            }
          break;

          case Shader.POLYGON:
            if (feature.type === Geometry.POLYGON && (style.lineColor || style.polygonFill)) {
              canvas.setStyle('strokeStyle', style.lineColor);
              canvas.setStyle('lineWidth',   style.lineWidth);
              canvas.setStyle('fillStyle',   style.polygonFill);

              canvas.drawPolygon(coordinates, strokeFillOrder);
            }
          break;

          case Shader.TEXT:
            if ((pos = layer.getCentroid(feature)) && style.textContent) {
              bbox = { id: feature.id, x: pos.x, y: pos.y, w: 100, h: style.fontSize };
              hasCollision = !style.textAllowOverlap && layer.hasCollision(symbolizer, bbox);

              if (!hasCollision) {
                canvas.setFont(style.fontSize, style.fontFace);
                canvas.setStyle('strokeStyle', style.textOutlineColor);
                canvas.setStyle('lineWidth',   style.textOutlineWidth);
                canvas.setStyle('fillStyle',   style.textFill);
// TODO: get real text width
// var len = context.measureText(text);
                canvas.drawText(style.textContent, pos.x - tileCoords.x*tileSize, pos.y - tileCoords.y*tileSize, style.textAlign, !!style.textOutlineColor);
                layer.addBBox(symbolizer, bbox);
              }
            }
          break;
        }
      }
      canvas.finishAll();
    }
  }
};

},{"./geometry":14,"./shader":25}],25:[function(_dereq_,module,exports){

var Shader = module.exports = function(style) {
  this._layers = [];
  if (style) {
    this.update(style);
  }
};

var proto = Shader.prototype;

module.exports.LINE    = 'line';
module.exports.POLYGON = 'polygon';
module.exports.POINT   = 'markers';
module.exports.TEXT    = 'text';

// clones every layer in the shader
proto.createHitShader = function() {
  var hitShader = new Shader();
  for (var i = 0; i < this._layers.length; i++) {
    hitShader._layers.push(this._layers[i].createHitShaderLayer());
  }
  return hitShader;
};

proto.update = function(style) {
  var cartoShader = new carto.RendererJS().render(style);

  if (!cartoShader || !cartoShader.layers) {
    return;
  }

  // requiring this late in order to avoid circular reference shader <-> shader.layer
  var ShaderLayer = _dereq_('./shader.layer');

  var cartoShaderLayer;
  for (var i = 0, il = cartoShader.layers.length; i < il; i++) {
    cartoShaderLayer = cartoShader.layers[i];
    this._layers[i] = new ShaderLayer(
      cartoShaderLayer.fullName(),
      this._cloneProperties(cartoShaderLayer.getShader()),
      cartoShaderLayer.getSymbolizers()
    );
  }
};

proto._cloneProperties = function(shader) {
  var cloned = {};
  for (var prop in shader) {
    if (shader[prop].style) {
      cloned[prop] = shader[prop].style;
    }
  }
  return cloned;
};

proto.getLayers = function() {
  return this._layers;
};

},{"./shader.layer":26}],26:[function(_dereq_,module,exports){

var Events = _dereq_('./core/events');
var Shader = _dereq_('./shader');

// https://www.mapbox.com/carto/api/2.3.0/

var propertyMapping = {
  'marker-width': 'markerSize',
  'marker-fill': 'markerFill',
  'marker-line-color': 'markerLineColor',
  'marker-line-width': 'markerLineWidth',
  'marker-color': 'markerFill',
  'marker-opacity': 'markerAlpha', // does that exist?
  'marker-allow-overlap': 'markerAllowOverlap',

  'line-color': 'lineColor',
  'line-width': 'lineWidth',
  'line-opacity': 'lineAlpha',
  'polygon-fill': 'polygonFill',
  'polygon-opacity': 'polygonAlpha',

  'text-face-name': 'fontFace',
  'text-size': 'fontSize',
  'text-fill': 'textFill',
  'text-opacity': 'textAlpha',
  'text-halo-fill': 'textOutlineColor',
  'text-halo-radius': 'textOutlineWidth',
  'text-align': 'textAlign',
  'text-name': 'textContent',
  'text-allow-overlap': 'textAllowOverlap'
};

var hitShaderProperties = [
  'markerFill',
  'markerLineColor',
  'lineColor',
  'polygonFill',
  'textFill',
  'textOutlineColor'
];

var ShaderLayer = module.exports = function(name, shaderSrc, shadingOrder) {
  Events.prototype.constructor.call(this);

  this._name = name || '';

  this._compiled = {};
  this.compile(shaderSrc);

  this._shadingOrder = shadingOrder || [
    Shader.POINT,
    Shader.POLYGON,
    Shader.LINE,
    Shader.TEXT
  ];
};

var proto = ShaderLayer.prototype = new Events();

proto.clone = function() {
  return new ShaderLayer(this._name, this._shaderSrc, this._shadingOrder);
};

proto.compile = function(shaderSrc) {
  this._shaderSrc = shaderSrc;
  if (typeof shaderSrc === 'string') {
    shaderSrc = function() {
      return shaderSrc;
    };
  }
  var property;
  for (var attr in shaderSrc) {
    if (property = propertyMapping[attr]) {
      this._compiled[property] = shaderSrc[attr];
    }
  }
  this.emit('change');
};

// given feature properties and map rendering content returns
// the style to apply to canvas context
// TODO: optimize this to not evaluate when featureProperties do not
// contain values involved in the shader
// TODO: hover / click should just complement existing properties
proto.getStyle = function(featureProperties, mapContext) {
  mapContext = mapContext || {};

  var nameAttachment = this._name.split('::')[1];

  if (nameAttachment === 'hover' &&
     (!mapContext.hovered || mapContext.hovered.cartodb_id !== featureProperties.cartodb_id)) {
    return {};
  }
  if (nameAttachment === 'click' &&
     (!mapContext.clicked || mapContext.clicked.cartodb_id !== featureProperties.cartodb_id)) {
    return {};
  }

  var
    style = {},
    compiled = this._compiled,
    // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#5-for-in
    props = Object.keys(compiled),
    prop, val;

  for (var i = 0, len = props.length; i < len; ++i) {
    prop = props[i];
    val = compiled[prop];

    if (typeof val === 'function') {
      val = val(featureProperties, mapContext);
    }
    style[prop] = val;
  }

  return style;
};

proto.getShadingOrder = function() {
  return this._shadingOrder;
};

/**
 * return a shader clone ready for hit test.
 */
proto.createHitShaderLayer = function() {
  var hitLayer = this.clone();
  for (var prop in hitLayer._compiled) {
    if (~hitShaderProperties.indexOf(prop)) {
      hitLayer._compiled[prop] = function(featureProperties, mapContext) {
        return 'rgb(' + Int2RGB(featureProperties.cartodb_id + 1).join(',') + ')';
      };
    }
  }

  // clone symbolizers and skip texts in hit layer
  hitLayer._shadingOrder = [];
  for (var i = 0, il = this._shadingOrder.length; i < il; i++) {
    if (this._shadingOrder[i] !== 'text') {
      hitLayer._shadingOrder.push(this._shadingOrder[i]);
    }
  }
  return hitLayer;
};

var RGB2Int = function(r, g, b) {
  return r | (g<<8) | (b<<16);
};

var Int2RGB = function(input) {
  var r = input & 0xff;
  var g = (input >> 8) & 0xff;
  var b = (input >> 16) & 0xff;
  return [r, g, b];
};

ShaderLayer.RGB2Int = RGB2Int;
ShaderLayer.Int2RGB = Int2RGB;

},{"./core/events":13,"./shader":25}],27:[function(_dereq_,module,exports){

var ShaderLayer = _dereq_('./shader.layer');
var Canvas = _dereq_('./canvas');

var Tile = module.exports = function(options) {
  options = options || {};

  this._tileSize = options.size || 256;
  this._canvas = new Canvas({ size: this._tileSize }),
  this._hitCanvas = new Canvas({ size: this._tileSize });

  this._layer = options.layer;
  this._renderer = options.renderer;
  this._data = [];
  this._coords = options.coords;

  var self = this;
  options.provider.load(options.coords, function(data) {
    self._data = data;
    self.render();
  });
};

var proto = Tile.prototype;

proto.getDomElement = function() {
  return this._canvas.getDomElement();
};

proto.getLayer = function() {
  return this._layer;
};

proto.getCoords = function() {
  return this._coords;
};

proto.getSize = function() {
  return this._tileSize;
};

proto.render = function() {
  var
    mapContext = { zoom: this._coords.z },
    hovered, clicked;

  if (hovered = this._layer.getHoveredFeature()) {
    mapContext.hovered = hovered;
  }

  if (clicked = this._layer.getClickedFeature()) {
    mapContext.clicked = clicked;
  }

  this._renderer.render(this, this._canvas, this._data, mapContext);
};

/**
 * return hit grid
 */
proto._renderHitGrid = function() {
  // store current shader and use hitShader for rendering the grid
  var currentShader = this._renderer.getShader();
  this._renderer.setShader(currentShader.createHitShader());
  this._renderer.render(this, this._hitCanvas, this._data, {
    zoom: this._coords.z
  });

  // restore shader
  this._renderer.setShader(currentShader);

  var data = this._hitCanvas.getData();

  // check, whether something has been drawn
  // TODO: maybe shader was not ready. try to check this instead
  for (var i = 0; i < data.length; i++) {
    if (data[i]) {
      return data;
    }
  }

//  console.log('FAILED to render hit canvas');
};

/**
 * returns feature id at position. null for fo feature
 * @pos: point object like {x: X, y: Y }
 */
proto.getFeatureAt = function(x, y) {
  if (!this._hitGrid) {
    this._hitGrid = this._renderHitGrid();
  }

  if (!this._hitGrid) {
    return;
  }

  var i = 4*((y|0) * this._tileSize + (x|0));

  if (this._hitGrid[i+3] < this._tileSize-1) {
    return;
  }

  var cartodb_id = ShaderLayer.RGB2Int(
    this._hitGrid[i  ],
    this._hitGrid[i+1],
    this._hitGrid[i+2]
  );

  if (!cartodb_id) {
    return;
  }

  var feature = this.getFeature(cartodb_id-1);
  if (feature) {
    return feature.properties;
  }
};

proto.getFeature = function(cartodb_id) {
  for (var i = 0, il = this._data.length; i < il; i++) {
    if (this._data[i].cartodb_id === cartodb_id) {
      return this._data[i];
    }
  }
  return;
};

},{"./canvas":11,"./shader.layer":26}]},{},[16])
(16)
});