/**
 * SkipJack Cipher 64bit version, 80bit key
 * translate from github.com/dstar4138/jskipjack java implementation
 */

var Long = require("long");
var URLSafeBase64 = require('urlsafe-base64');

var LONG_BYTES = 8;

var SkipConstants = {
    F: [ 
        0xa3, 0xd7, 0x09, 0x83, 0xf8, 0x48, 0xf6, 0xf4, 0xb3, 0x21,
        0x15, 0x78, 0x99, 0xb1, 0xaf, 0xf9, 0xe7, 0x2d, 0x4d, 0x8a, 0xce, 0x4c, 0xca, 0x2e,
        0x52, 0x95, 0xd9, 0x1e, 0x4e, 0x38, 0x44, 0x28, 0x0a, 0xdf, 0x02, 0xa0, 0x17, 0xf1,
        0x60, 0x68, 0x12, 0xb7, 0x7a, 0xc3, 0xe9, 0xfa, 0x3d, 0x53, 0x96, 0x84, 0x6b, 0xba,
        0xf2, 0x63, 0x9a, 0x19, 0x7c, 0xae, 0xe5, 0xf5, 0xf7, 0x16, 0x6a, 0xa2, 0x39, 0xb6,
        0x7b, 0x0f, 0xc1, 0x93, 0x81, 0x1b, 0xee, 0xb4, 0x1a, 0xea, 0xd0, 0x91, 0x2f, 0xb8,
        0x55, 0xb9, 0xda, 0x85, 0x3f, 0x41, 0xbf, 0xe0, 0x5a, 0x58, 0x80, 0x5f, 0x66, 0x0b,
        0xd8, 0x90, 0x35, 0xd5, 0xc0, 0xa7, 0x33, 0x06, 0x65, 0x69, 0x45, 0x00, 0x94, 0x56,
        0x6d, 0x98, 0x9b, 0x76, 0x97, 0xfc, 0xb2, 0xc2, 0xb0, 0xfe, 0xdb, 0x20, 0xe1, 0xeb,
        0xd6, 0xe4, 0xdd, 0x47, 0x4a, 0x1d, 0x42, 0xed, 0x9e, 0x6e, 0x49, 0x3c, 0xcd, 0x43,
        0x27, 0xd2, 0x07, 0xd4, 0xde, 0xc7, 0x67, 0x18, 0x89, 0xcb, 0x30, 0x1f, 0x8d, 0xc6,
        0x8f, 0xaa, 0xc8, 0x74, 0xdc, 0xc9, 0x5d, 0x5c, 0x31, 0xa4, 0x70, 0x88, 0x61, 0x2c,
        0x9f, 0x0d, 0x2b, 0x87, 0x50, 0x82, 0x54, 0x64, 0x26, 0x7d, 0x03, 0x40, 0x34, 0x4b,
        0x1c, 0x73, 0xd1, 0xc4, 0xfd, 0x3b, 0xcc, 0xfb, 0x7f, 0xab, 0xe6, 0x3e, 0x5b, 0xa5,
        0xad, 0x04, 0x23, 0x9c, 0x14, 0x51, 0x22, 0xf0, 0x29, 0x79, 0x71, 0x7e, 0xff, 0x8c,
        0x0e, 0xe2, 0x0c, 0xef, 0xbc, 0x72, 0x75, 0x6f, 0x37, 0xa1, 0xec, 0xd3, 0x8e, 0x62,
        0x8b, 0x86, 0x10, 0xe8, 0x08, 0x77, 0x11, 0xbe, 0x92, 0x4f, 0x24, 0xc5, 0x32, 0x36,
        0x9d, 0xcf, 0xf3, 0xa6, 0xbb, 0xac, 0x5e, 0x6c, 0xa9, 0x13, 0x57, 0x25, 0xb5, 0xe3,
        0xbd, 0xa8, 0x3a, 0x01, 0x05, 0x59, 0x2a, 0x46 
    ]
};

var SkipJack = module.exports = function(secret) {
    this.secret = secret.slice(0); // copy secret
}


SkipJack.prototype.encodeBase64URLSafeStringLong = function(value) {
    var encoded = this.encrypt(value);

    // byte[] rawData = ByteBuffer.allocate(8).putLong(encoded).array();
    var buf = new Buffer(LONG_BYTES);
    buf.writeInt32BE(encoded.high);
    buf.writeInt32BE(encoded.low, 4);
   
    // return Base64.encodeBase64URLSafeString(rawData);
    return URLSafeBase64.encode(buf);
}

SkipJack.prototype.decodeBase64Long = function(value) {
	// byte[] encrypted = Base64.decodeBase64(value);
	var buf = URLSafeBase64.decode(value);
    if (buf.length != LONG_BYTES) {
        throw new Error("fail to decode: " + value);
    }
    // long encoded = ByteBuffer.wrap(encrypted).getLong();
    var encoded = new Long(buf.readUInt32BE(4), buf.readUInt32BE(0));
    return this.decrypt(encoded);
}

SkipJack.prototype.encrypt = function(value) {
	if (typeof value == "number") {
		value = Long.fromNumber(value);
	}
    return encrypt(value, this.secret);
}

SkipJack.prototype.decrypt = function(value) {
    return decrypt(value, this.secret);
}


function encrypt(message, key) {
    var state = message;

    var stepcounter = 0;//k starts at 0
    while (stepcounter < 8) { // 8 rounds of rule A.
        state = roundA(stepcounter, key, state);
        stepcounter++;
    }
    while (stepcounter < 16) { // 8 rounds of rule B.
        state = roundB(stepcounter, key, state);
        stepcounter++;
    }

    // do that same thing again. Thus 32 rounds.
    while (stepcounter < 24) {
        state = roundA(stepcounter, key, state);
        stepcounter++;
    }
    while (stepcounter < 32) {
        state = roundB(stepcounter, key, state);
        stepcounter++;
    }

    return state;
}

function decrypt(message, key) {
    var state = message;

    var stepcounter = 31;//k starts at 31
    while (stepcounter > 23) { // 8 rounds of rule B.
        state = roundBprime(stepcounter, key, state);
        stepcounter--;
    }
    while (stepcounter > 15) { // 8 rounds of rule A.
        state = roundAprime(stepcounter, key, state);
        stepcounter--;
    }

    // do that same thing again. Thus 32 rounds.
    while (stepcounter > 7) {
        state = roundBprime(stepcounter, key, state);
        stepcounter--;
    }
    while (stepcounter > -1) {
        state = roundAprime(stepcounter, key, state);
        stepcounter--;
    }

    return state;
}

function roundA(step, key, block) {
    var w_1i, w_2i, w_3i, w_4i;
    var w_1o, w_2o, w_3o, w_4o;
    w_1i = w_2i = w_3i = w_4i = w_1o = w_2o = w_3o = Long.ZERO;

	var mask = new Long(0xFFFF, 0);
    // w_1i = block >>> 48;
    w_1i = block.shiftRightUnsigned(48);
    // w_2i = block >> 32 & 0xFFFFL;
    w_2i = block.shiftRight(32).and(mask);
    // w_3i = block >> 16 & 0xFFFFL;
    w_3i = block.shiftRight(16).and(mask);
    // w_4i = block & 0xFFFFL;
    w_4i = block.and(mask);

    w_1o = G(step, key, w_1i).xor(w_4i).xor(step + 1);
    w_2o = G(step, key, w_1i);
    w_3o = w_2i;
    w_4o = w_3i;

    // return w_1o << 48 | w_2o << 32 | w_3o << 16 | w_4o;
    return w_1o.shiftLeft(48).or(w_2o.shiftLeft(32)).or(w_3o.shiftLeft(16)).or(w_4o);
}

function roundB(step, key, block) {
    var w_1i, w_2i, w_3i, w_4i;
    var w_1o, w_2o, w_3o, w_4o;
    w_1i = w_2i = w_3i = w_4i = w_1o = w_2o = w_3o = Long.ZERO;

	var mask = new Long(0xFFFF, 0);
    // w_1i = block >>> 48;
    w_1i = block.shiftRightUnsigned(48);
    // w_2i = block >> 32 & 0xFFFFL;
    w_2i = block.shiftRight(32).and(mask);
    // w_3i = block >> 16 & 0xFFFFL;
    w_3i = block.shiftRight(16).and(mask);
    // w_4i = block & 0xFFFFL;
    w_4i = block.and(mask);

    w_1o = w_4i;
    w_2o = G(step, key, w_1i);
    // w_3o = w_1i ^ w_2i ^ step + 1;
    w_3o = w_1i.xor(w_2i).xor(step + 1);
    w_4o = w_3i;

    // return w_1o << 48 | w_2o << 32 | w_3o << 16 | w_4o;
    return w_1o.shiftLeft(48).or(w_2o.shiftLeft(32)).or(w_3o.shiftLeft(16)).or(w_4o);
}

function roundAprime(step, key, block) {
    var w_1i, w_2i, w_3i, w_4i;
    var w_1o, w_2o, w_3o, w_4o;
    w_1i = w_2i = w_3i = w_4i = w_1o = w_2o = w_3o = Long.ZERO;

	var mask = new Long(0xFFFF, 0);
    // w_1i = block >>> 48;
    w_1i = block.shiftRightUnsigned(48);
    // w_2i = block >> 32 & 0xFFFFL;
    w_2i = block.shiftRight(32).and(mask);
    // w_3i = block >> 16 & 0xFFFFL;
    w_3i = block.shiftRight(16).and(mask);
    // w_4i = block & 0xFFFFL;
    w_4i = block.and(mask);

    w_1o = Gprime(step, key, w_2i);
    w_2o = w_3i;
    w_3o = w_4i;
    // w_4o = w_1i ^ w_2i ^ step + 1;
    w_4o = w_1i.xor(w_2i).xor(step + 1);

    // return w_1o << 48 | w_2o << 32 | w_3o << 16 | w_4o;
    return w_1o.shiftLeft(48).or(w_2o.shiftLeft(32)).or(w_3o.shiftLeft(16)).or(w_4o);
}

function roundBprime(step, key, block) {
    var w_1i, w_2i, w_3i, w_4i;
    var w_1o, w_2o, w_3o, w_4o;
    w_1i = w_2i = w_3i = w_4i = w_1o = w_2o = w_3o = Long.ZERO;

    var mask = new Long(0xFFFF, 0);
    // w_1i = block >>> 48;
    w_1i = block.shiftRightUnsigned(48);
    // w_2i = block >> 32 & 0xFFFFL;
    w_2i = block.shiftRight(32).and(mask);
    // w_3i = block >> 16 & 0xFFFFL;
    w_3i = block.shiftRight(16).and(mask);
    // w_4i = block & 0xFFFFL;
    w_4i = block.and(mask);

    w_1o = Gprime(step, key, w_2i);
    // w_2o = Gprime(step, key, w_2i) ^ w_3i ^ step + 1;
    w_2o = Gprime(step, key, w_2i).xor(w_3i).xor(step + 1);
    w_3o = w_4i;
    w_4o = w_1i;

    //return w_1o << 48 | w_2o << 32 | w_3o << 16 | w_4o;
    return w_1o.shiftLeft(48).or(w_2o.shiftLeft(32)).or(w_3o.shiftLeft(16)).or(w_4o);
}

function G(step, key, w) {
    var g_1, g_2, g_3, g_4, g_5, g_6, cv0, cv1, cv2, cv3;
    g_1 = g_2 = g_3 = g_4 = g_5 = g_6 = cv0 = cv1 = cv2 = 0;

	// g_1 = (int) (w >>> 8);
    g_1 = w.shiftRightUnsigned(8).toInt();
    // g_2 = (int) (w & 0xFF);
    g_2 = w.and(0xFF).toInt();

    cv0 = key[step * 4 % 10];
    cv1 = key[(step * 4 + 1) % 10];
    cv2 = key[(step * 4 + 2) % 10];
    cv3 = key[(step * 4 + 3) % 10];

    g_3 = SkipConstants.F[g_2 ^ cv0] ^ g_1;
    g_4 = SkipConstants.F[g_3 ^ cv1] ^ g_2;
    g_5 = SkipConstants.F[g_4 ^ cv2] ^ g_3;
    g_6 = SkipConstants.F[g_5 ^ cv3] ^ g_4;

    return new Long(g_5 << 8 | g_6, 0);
}

function Gprime(step, key, w) {
    var g_1, g_2, g_3, g_4, g_5, g_6, cv0, cv1, cv2, cv3;
    g_1 = g_2 = g_3 = g_4 = g_5 = g_6 = cv0 = cv1 = cv2 = 0;

    // g_1 = (int) (w & 0xFF);
    g_1 = w.and(0xFF).toInt();
    // g_2 = (int) (w >>> 8);
    g_2 = w.shiftRightUnsigned(8).toInt();

    cv0 = key[(step * 4 + 3) % 10];
    cv1 = key[(step * 4 + 2) % 10];
    cv2 = key[(step * 4 + 1) % 10];
    cv3 = key[step * 4 % 10];

    g_3 = SkipConstants.F[g_2 ^ cv0] ^ g_1;
    g_4 = SkipConstants.F[g_3 ^ cv1] ^ g_2;
    g_5 = SkipConstants.F[g_4 ^ cv2] ^ g_3;
    g_6 = SkipConstants.F[g_5 ^ cv3] ^ g_4;

    return new Long(g_6 << 8 | g_5, 0);
}
