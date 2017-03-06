/*
	byte 16=Fan
		FAN control
		b7+b6+b5+b4 = Fan speed
			Fan: b7+b6+b5+b4
			0×30 = 1 bar
			0×40 = 2 bar
			0×50 = 3 bar
			0×60 = 4 bar
			0×70 = 5 bar
			0xa0 = Auto
			0xb0 = Not auto, moon + tree
		b3+b2+b1+b0 = Swing control up/down
			Swing control up/down:
			0000 = Swing up/down off
			1111 = Swing up/down on
	byte 17
			Swing control left/right:
			0000 = Swing left/right off
			1111 = Swing left/right on
*/

/*
  10001000 => 00010001 => 0x11    \
  01011011 => 11011010 => 0xDA     |
  11100100 => 00100111 => 0x27     |
  00001111 => 11110000 => 0xF0      >  Checksum1
  00000000 => 00000000 => 0x00     |
  00000000 => 00000000 => 0x00     |
  00000000 => 00000000 => 0x00     |
  01000000 => 00000010 => 0x02    /
  10001000 => 00010001 => 0x11
  01011011 => 11011010 => 0xDA
  11100100 => 00100111 => 0x27
  00000000 => 00000000 => 0x00
  00000000 => 00000000 => 0x00
  00001100 => 00110000 => 0x27    => 0 + Mode => 011 = Cool, 100 = Heat, 110 = FAN, 000 = Fully Automatic + 0 + OFF Timer + On Timer + ON | OFF
  00100100 => 00100100 => 0x24    => Temperature * 2
  00000000 => 00000000 => 0x00
  00000101 => 10100000 => 0xA0    => Fan Auto + Swing Off
  00000000 => 00000000 => 0x00
  00000000 => 00000000 => 0x00
  00000000 => 00000000 => 0x00
  00000000 => 00000000 => 0x00
  00000000 => 00000000 => 0x00    => Powerfull
  00000000 => 00000000 => 0x00
  00000011 => 11000000 => 0xC0
  00000000 => 00000000 => 0x00
  00000000 => 00000000 => 0x00
  01100011 => 11000110 => 0xC6    => Checksum2
*/

// Fully Automatic 18 Fan Auto Swing Off 
const DEFAULT = [
  0x11, 0xDA, 0x27, 0xF0, 0x00, 0x00, 0x00, 0x02,
  // 0  1     2     3     4     5     6     7
  0x11, 0xDA, 0x27, 0x00, 0x00, 0x27, 0x24, 0x00,
  // 8  9     10    11    12    13    14    15
  0xA0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0xC6
  // 16 17    18    19    20    21    22    23    24    25    26
];

function printBinary(option) {
  console.log(option.map((opt, index) => `#${index} ${"00000000".substr(opt.toString(2).length)}${opt.toString(2)}`).join('\n'));
}

function getBinaryString(option) {
  return option.map((opt, index) => `${"00000000".substr(opt.toString(2).length)}${opt.toString(2)}`)
               .map(m => m.split('').reverse().join('')); // reverse the bit
}

function encode(isOpen = true, mode = 'auto', temperature = 26) {
  const option = DEFAULT.slice(0);
  const modes = {
    auto: 0b0000,
    fan: 0b0110,
    heat: 0b0100,
    cool: 0b0011,
  };

  if (isOpen) {
    option[13] |= 0x01; // bitwise or operator => 0010 0111 | 0000 0001 => 0010 0111  
  } else {
    option[13] &= 0xFE; // bitwise and operator => 0010 0111 & 1111 1110 => 0010 0110
  }

  option[13] = modes[mode] << 4 | (option[13] & 0x01);

  option[14] = temperature << 1; // wao

  option[26] = option.reduce((result, current, index) => {
    if (index > 7 && index < 26) result += current;
    return result;
  }, 0) % 256;

  return option;
}

module.exports = {
  encode,
  printBinary,
  getBinaryString,
};
