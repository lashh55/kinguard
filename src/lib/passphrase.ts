// Curated family-friendly, easy-to-pronounce common English nouns.
// No medical terms, no slang, no obscure words.
const WORDS = [
  "apple","river","coffee","sunny","bird","window","garden","mountain","ocean","forest",
  "meadow","sunset","morning","silver","golden","purple","orange","yellow","violet","crimson",
  "rabbit","puppy","kitten","horse","tiger","panda","dolphin","turtle","penguin","squirrel",
  "robin","sparrow","eagle","falcon","butterfly","ladybug","cricket","honey","maple","cedar",
  "willow","cherry","pebble","cabin","cottage","candle","blanket","pillow","teapot","kettle",
  "muffin","biscuit","pancake","cookie","sandwich","cinnamon","ginger","vanilla","caramel","mango",
  "peach","lemon","melon","banana","pumpkin","tomato","carrot","potato","onion","pepper",
  "basket","button","ribbon","feather","pebble","marble","crystal","diamond","emerald","ruby",
  "guitar","piano","trumpet","banjo","drum","violin","flute","harp","whistle","melody",
  "harbor","island","valley","canyon","desert","prairie","glacier","jungle","beach","lagoon",
  "anchor","compass","lantern","mirror","pencil","paper","letter","jacket","sweater","slipper",
  "bicycle","wagon","sailboat","balloon","kite","puzzle","crayon","bubble","mitten","scarf",
  "garden","picnic","camera","journal","postcard","library","theater","bakery","cottage","castle",
  "bridge","fountain","tower","cabin","barn","stable","windmill","lighthouse","train","tractor",
  "summer","winter","spring","autumn","sunrise","twilight","midnight","rainbow","thunder","snowfall",
  "cloud","breeze","ripple","puddle","creek","stream","pond","lake","wave","tide",
  "panther","beaver","otter","badger","moose","raccoon","reindeer","walrus","seagull","starfish",
  "violet","daisy","tulip","sunflower","rose","lily","jasmine","poppy","clover","ivy",
  "biscuit","cupcake","sundae","pretzel","waffle","pickle","noodle","pepper","sugar","butter",
  "blanket","slipper","mitten","scarf","jacket","raincoat","umbrella","sandals","sneaker","helmet"
];

const UNIQUE = Array.from(new Set(WORDS));

function pickWord(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return UNIQUE[buf[0] % UNIQUE.length];
}

export function generatePassphrase(): string {
  let a = pickWord();
  let b = pickWord();
  while (b === a) b = pickWord();
  return `${a}-${b}`;
}

