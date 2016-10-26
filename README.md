SkipJack
==========

SkipJack Cipher with 64bit integer support for node.js.

Porting from [dstar4138/jskipjack java](https://github.com/dstar4138/jskipjack).

Use [Long.js](https://github.com/dcodeIO/long.js) for 64bit interger operations.


Install
----------
```shell
npm install skipjack

```


Usage
----------

```javascript
var SkipJack = require("skipjack");
var skipJack = new SkipJack([9, 1, 6, 3, 9, 1, 8, 1, 2, 7, 8]);

// encrypt to long
var encrypted = skipJack.encrypt(1234);
console.log(encrypted);
// Long { low: 1661877777, high: -1763827013, unsigned: false }


// decrypt from long
var decrypted = skipJack.decrypt(encrypted);
console.log(decrypted, decrypted.toNumber());
// Long { low: 1234, high: 0, unsigned: false } 1234

// encrypt to base64 string
var encryptedBase64 = skipJack.encodeBase64URLSafeStringLong(1234);
console.log(encryptedBase64);
// lt4iu2MOPhE

// decrypt from base64 string
var decrypted2 = skipJack.decodeBase64Long(encryptedBase64);
console.log(decrypted2);
// Long { low: 1234, high: 0, unsigned: false }

```
