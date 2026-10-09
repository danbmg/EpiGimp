// Les pixels d'une image, comme un ImageData : 4 nombres par pixel (rouge, vert, bleu, alpha) de 0 à 255,
// ligne par ligne depuis le coin haut gauche. Un vrai ImageData convient partout où ce type est demandé.
export interface Pixels {
  width: number;
  height: number;
  data: Uint8ClampedArray<ArrayBuffer>;
}

// Un filtre : une fonction pure qui lit une image et en renvoie une nouvelle, sans toucher à l'originale.
export type Filter = (image: Pixels) => Pixels;
