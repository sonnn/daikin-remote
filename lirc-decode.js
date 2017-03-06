/*
  Data:
    740   1495   920   1345  735   1335
    ...
  Mean:
    IR Led will be on for 740us and off for 1495us
  
  In data we will have 4 kinds of character to decode: 
    Intro: "["
    End: "]"
    Bit: 0, 1

  Assume:
    Close to 400us is 0
    Close to 1300us is 1
    Margin distance is 150us
    Intro close to 3500
    End close to 9900 
    2 pair number in a row is represent 1 bit 
    
  Fact:
    First line is recording start and the arrival of the first IR signal. Only have 1 value, can be ignore
*/

const MARGIN            = 200;

const INTRO_HEAD        = 3500;
const INTRO_TAIL        = 1700;

const END_HEAD          = 400;
const END_TAIL          = 30000;

const IR_ZERO           = 450;
const IR_ONE            = 1320;

function decode(value1, value2) {
  // test pair is intro or not
  if (Math.abs(value1 - INTRO_HEAD) < MARGIN && Math.abs(value2 - INTRO_TAIL) < MARGIN) return '[';
  // test pair is end or not
  if (Math.abs(value1 - END_HEAD) < MARGIN && Math.abs(value2 - END_TAIL) < 500) return ']';
  // test pair is bit 0
  if (Math.abs(value1 - IR_ZERO) < MARGIN && Math.abs(value2 - IR_ZERO) < MARGIN) return '0';
  // test pair is bit 1
  if (Math.abs(value1 - IR_ZERO) < MARGIN && Math.abs(value2 - IR_ONE) < MARGIN) return '1';
  console.log(value1, value2);
  return '?'
}

const fs = require('fs');

function listBinary(str) {
  let count = 0;
  return str.split('').map(s => {
    if (s === '[' || s === ']') return ' ';
    if (count < 8) {
      count++;
      return s;
    } else {
      count = 1;
      return ` ${s}`;
    }
  }).join('').trim().split(new RegExp(/\s+/g));
}

function execute(input) {
  const file = fs.readFileSync(input, { encoding: 'utf8' });
  const rows = file.split('\n').map(str => str.trim());
  let result = '';

  if (rows && rows.length > 0) {
    rows.forEach(row => {
      const clean = row.split(new RegExp(/\s+/g));

      // ignore the first line
      if (clean.length > 1) {
        for (let index = 0; index < 3; index ++) {
          result += decode(clean[index*2], clean[index*2 + 1]);
        }
      }
    });
  }
  result += ']'; // make output easier to read
  console.log(result);
  return listBinary(result);
}

const argv = process.argv.slice(2);

if (argv.length < 1) return console.log('usage <decode file>');
return console.log(execute(argv[0]));
