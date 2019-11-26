/**
 * UTF16和UTF8转换对照表
 * U+00000000 – U+0000007F 	0xxxxxxx
 * U+00000080 – U+000007FF 	110xxxxx 10xxxxxx
 * U+00000800 – U+0000FFFF 	1110xxxx 10xxxxxx 10xxxxxx
 * U+00010000 – U+001FFFFF 	11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
 * U+00200000 – U+03FFFFFF 	111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
 * U+04000000 – U+7FFFFFFF 	1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
 */
//外部js引用时这样写：import {Base64} from '/xxx/base64';//路径需要根据实际路径去写
export let Base64 = {
  // 转码表
  tables: [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '+',
    '/',
  ],
  UTF16ToUTF8: function(str) {
    let results = [],
      len = str.length;
    for (let i = 0; i < len; i++) {
      let code = str.charCodeAt(i);
      if (code > 0x0000 && code <= 0x007f) {
        /* 一字节，不考虑0x0000，因为是空字节
				   U+00000000 – U+0000007F 	0xxxxxxx
				*/
        results.push(str.charAt(i));
      } else if (code >= 0x0080 && code <= 0x07ff) {
        /* 二字节
				   U+00000080 – U+000007FF 	110xxxxx 10xxxxxx
				   110xxxxx
				*/
        let byte1 = 0xc0 | ((code >> 6) & 0x1f);
        // 10xxxxxx
        let byte2 = 0x80 | (code & 0x3f);
        results.push(String.fromCharCode(byte1), String.fromCharCode(byte2));
      } else if (code >= 0x0800 && code <= 0xffff) {
        /* 三字节
				   U+00000800 – U+0000FFFF 	1110xxxx 10xxxxxx 10xxxxxx
				   1110xxxx
				*/
        let byte1 = 0xe0 | ((code >> 12) & 0x0f);
        // 10xxxxxx
        let byte2 = 0x80 | ((code >> 6) & 0x3f);
        // 10xxxxxx
        let byte3 = 0x80 | (code & 0x3f);
        results.push(String.fromCharCode(byte1), String.fromCharCode(byte2), String.fromCharCode(byte3));
      } else if (code >= 0x00010000 && code <= 0x001fffff) {
        // 四字节
        // U+00010000 – U+001FFFFF 	11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      } else if (code >= 0x00200000 && code <= 0x03ffffff) {
        // 五字节
        // U+00200000 – U+03FFFFFF 	111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      } /** if (code >= 0x04000000 && code <= 0x7FFFFFFF)*/ else {
        // 六字节
        // U+04000000 – U+7FFFFFFF 	1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      }
    }

    return results.join('');
  },
  UTF8ToUTF16: function(str) {
    let results = [],
      len = str.length;
    let i = 0;
    for (let i = 0; i < len; i++) {
      let code = str.charCodeAt(i);
      // 第一字节判断
      if (((code >> 7) & 0xff) == 0x0) {
        // 一字节
        // 0xxxxxxx
        results.push(str.charAt(i));
      } else if (((code >> 5) & 0xff) == 0x6) {
        // 二字节
        // 110xxxxx 10xxxxxx
        let code2 = str.charCodeAt(++i);
        let byte1 = (code & 0x1f) << 6;
        let byte2 = code2 & 0x3f;
        let utf16 = byte1 | byte2;
        results.push(String.fromCharCode(utf16));
      } else if (((code >> 4) & 0xff) == 0xe) {
        // 三字节
        // 1110xxxx 10xxxxxx 10xxxxxx
        let code2 = str.charCodeAt(++i);
        let code3 = str.charCodeAt(++i);
        let byte1 = (code << 4) | ((code2 >> 2) & 0x0f);
        let byte2 = ((code2 & 0x03) << 6) | (code3 & 0x3f);
        let utf16 = ((byte1 & 0x00ff) << 8) | byte2;
        results.push(String.fromCharCode(utf16));
      } else if (((code >> 3) & 0xff) == 0x1e) {
        // 四字节
        // 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
      } else if (((code >> 2) & 0xff) == 0x3e) {
        // 五字节
        // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      } /** if (((code >> 1) & 0xFF) == 0x7E)*/ else {
        // 六字节
        // 1111110x 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx 10xxxxxx
      }
    }

    return results.join('');
  },
  encode: function(str) {
    if (!str) {
      return '';
    }
    let utf8 = this.UTF16ToUTF8(str); // 转成UTF-8
    let i = 0; // 遍历索引
    let len = utf8.length;
    let results = [];
    while (i < len) {
      let c1 = utf8.charCodeAt(i++) & 0xff;
      results.push(this.tables[c1 >> 2]);
      // 补2个=
      if (i == len) {
        results.push(this.tables[(c1 & 0x3) << 4]);
        results.push('==');
        break;
      }
      let c2 = utf8.charCodeAt(i++);
      // 补1个=
      if (i == len) {
        results.push(this.tables[((c1 & 0x3) << 4) | ((c2 >> 4) & 0x0f)]);
        results.push(this.tables[(c2 & 0x0f) << 2]);
        results.push('=');
        break;
      }
      let c3 = utf8.charCodeAt(i++);
      results.push(this.tables[((c1 & 0x3) << 4) | ((c2 >> 4) & 0x0f)]);
      results.push(this.tables[((c2 & 0x0f) << 2) | ((c3 & 0xc0) >> 6)]);
      results.push(this.tables[c3 & 0x3f]);
    }

    return results.join('');
  },
  decode: function(str) {
    //判断是否为空
    if (!str) {
      return '';
    }

    let len = str.length;
    let i = 0;
    let results = [];
    //循环解出字符数组
    while (i < len) {
      let code1 = this.tables.indexOf(str.charAt(i++));
      let code2 = this.tables.indexOf(str.charAt(i++));
      let code3 = this.tables.indexOf(str.charAt(i++));
      let code4 = this.tables.indexOf(str.charAt(i++));

      let c1 = (code1 << 2) | (code2 >> 4);
      results.push(String.fromCharCode(c1));

      if (code3 != -1) {
        let c2 = ((code2 & 0xf) << 4) | (code3 >> 2);
        results.push(String.fromCharCode(c2));
      }
      if (code4 != -1) {
        let c3 = ((code3 & 0x3) << 6) | code4;
        results.push(String.fromCharCode(c3));
      }
    }

    return this.UTF8ToUTF16(results.join(''));
  },
};
