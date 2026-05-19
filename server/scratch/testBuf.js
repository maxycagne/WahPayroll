const u8 = new Uint8Array([1,2,3]);
const buf1 = Buffer.from(u8);
console.log(buf1.toString('base64'));

const buf2 = Buffer.from(Buffer.from([1,2,3]));
console.log(buf2.toString('base64'));
