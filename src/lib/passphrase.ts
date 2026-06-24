// Simple, common, familiar everyday words that seniors easily recognize.
const WORDS = [
  "apple","river","sunny","bird","garden","ocean","forest","sunset","morning","silver",
  "golden","yellow","rabbit","puppy","kitten","horse","robin","eagle","honey","maple",
  "cherry","cabin","candle","blanket","pillow","teapot","cookie","sandwich","vanilla","mango",
  "peach","lemon","banana","pumpkin","carrot","basket","ribbon","feather","mirror","pencil",
  "paper","jacket","sweater","bicycle","balloon","kite","mitten","scarf","picnic","camera",
  "library","bakery","cottage","castle","bridge","tower","barn","train","summer","winter",
  "spring","autumn","sunrise","rainbow","cloud","breeze","puddle","creek","pond","lake",
  "daisy","tulip","sunflower","rose","lily","clover","cupcake","waffle","butter","sugar",
  "raincoat","umbrella","sneaker","helmet","window","meadow","mountain","beach","valley","island"
];


function pickWord(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return WORDS[buf[0] % WORDS.length];
}

export function generatePassphrase(): string {
  let a = pickWord();
  let b = pickWord();
  while (b === a) b = pickWord();
  return `${a}-${b}`;
}

