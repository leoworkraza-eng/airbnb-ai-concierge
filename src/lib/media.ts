import type { Place } from "./types";

/* ---------------------------------------------------------------------------
   Photography.

   Every image is self-hosted in /public/media (no remote hotlinking, so a
   third-party CDN going down can never break a page) and every one is under a
   free licence that allows reuse. The credit list below is rendered in the
   landing footer and repeated in public/media/CREDITS.md.
   --------------------------------------------------------------------------- */

export const media = {
  cover: "/media/eixample-street.jpg",
  facade: "/media/eixample-facade.jpg",
  rooftop: "/media/rooftop.jpg",
  interior: "/media/interior.jpg",
  sagrada: "/media/sagrada.jpg",
  guell: "/media/guell.jpg",
  beach: "/media/beach.jpg",
  boqueria: "/media/boqueria.jpg",
  tapas: "/media/tapas.jpg",
  montjuic: "/media/montjuic.jpg",
  batllo: "/media/batllo.jpg",
} as const;

export type MediaCredit = {
  file: string;
  title: string;
  author: string;
  license: string;
  href: string;
};

const commons = (title: string) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}`;

export const mediaCredits: MediaCredit[] = [
  {
    file: "eixample-street.jpg",
    title: "Dreta de l'Eixample, Barcelona (P1170611)",
    author: "Matti Blume",
    license: "CC BY-SA 4.0",
    href: commons("Dreta de l Eixample, Barcelona (P1170611).jpg"),
  },
  {
    file: "eixample-facade.jpg",
    title: "Dreta de l'Eixample, Barcelona (P1170608)",
    author: "Matti Blume",
    license: "CC BY-SA 4.0",
    href: commons("Dreta de l Eixample, Barcelona (P1170608).jpg"),
  },
  {
    file: "rooftop.jpg",
    title: "Rooftop terrace of La Pedrera",
    author: "Bravodelnorte",
    license: "CC0",
    href: commons(
      "Chimneys on the rooftop terrace of Gaudi's La Pedrera in Barcelona.jpg",
    ),
  },
  {
    file: "interior.jpg",
    title: "Interior of Casa Batlló",
    author: "CEphoto, Uwe Aranas",
    license: "CC BY-SA 3.0",
    href: commons("Barcelona Spain Interior-view-in-Casa Batlló-01.jpg"),
  },
  {
    file: "sagrada.jpg",
    title: "Sagrada Família",
    author: "Alvesgaspar",
    license: "CC BY-SA 4.0",
    href: commons("Sagrada Familia March 2015-10a.jpg"),
  },
  {
    file: "guell.jpg",
    title: "Park Güell",
    author: "Alvesgaspar",
    license: "CC BY-SA 4.0",
    href: commons("Parc Guell Barcelona May 2026-10.jpg"),
  },
  {
    file: "beach.jpg",
    title: "Barceloneta beach",
    author: "Matti Blume",
    license: "CC BY-SA 4.0",
    href: commons("Beach, Barcelona (P1170713).jpg"),
  },
  {
    file: "boqueria.jpg",
    title: "Mercat de la Boqueria",
    author: "Matti Blume",
    license: "CC BY-SA 4.0",
    href: commons("Boqueria, Barcelona (P1170752).jpg"),
  },
  {
    file: "tapas.jpg",
    title: "Tapas bar in Barcelona",
    author: "HakanGonenli",
    license: "CC BY-SA 3.0",
    href: commons("Tapas bar in Barcelona.jpg"),
  },
  {
    file: "montjuic.jpg",
    title: "Montjuïc gardens",
    author: "Txllxt TxllxT",
    license: "CC BY-SA 4.0",
    href: commons(
      "Barcelona - Montjuïc - Jardins de Joan Brossa - Panorama View over Barcelona 02.jpg",
    ),
  },
  {
    file: "batllo.jpg",
    title: "Casa Batlló",
    author: "Bernard Gagnon",
    license: "CC BY-SA 3.0",
    href: commons("Casa Batlló 01.jpg"),
  },
];

/* Explicit matches first, then a sensible category fallback, so every curated
   venue always has a photograph and none of them can 404. */
const byId: Record<string, { src: string; alt: string }> = {
  "pl-sagrada": { src: media.sagrada, alt: "The spires of the Sagrada Família" },
  "pl-park-guell": { src: media.guell, alt: "Mosaic terraces in Park Güell" },
  "pl-casa-batllo": { src: media.batllo, alt: "The facade of Casa Batlló" },
  "pl-macba": { src: media.interior, alt: "A light-filled gallery interior" },
  "pl-miro": { src: media.montjuic, alt: "Gardens on Montjuïc" },
  "pl-boqueria": { src: media.boqueria, alt: "Produce stalls in La Boqueria" },
  "pl-barceloneta": { src: media.beach, alt: "Barceloneta beach and sea" },
  "pl-bunkers": { src: media.montjuic, alt: "A hillside view across Barcelona" },
  "pl-llibreria": { src: media.interior, alt: "A quiet interior reading room" },
  "pl-encants": { src: media.boqueria, alt: "Market stalls under cover" },
  "pl-gaudi-ave": { src: media.sagrada, alt: "Gaudí's architecture in Barcelona" },
  "pl-montjuic": { src: media.montjuic, alt: "Terraced gardens on Montjuïc" },
  "pl-tapas-mallorca": { src: media.tapas, alt: "A tapas bar counter" },
  "pl-pasta-born": { src: media.tapas, alt: "A small restaurant table" },
  "pl-pizza-gracia": { src: media.tapas, alt: "Pizza and wine on a table" },
  "pl-vermut-sants": { src: media.tapas, alt: "Vermouth served at a bar" },
  "pl-cafe-eixample": { src: media.interior, alt: "A calm café interior" },
  "pl-cafe-raval": { src: media.interior, alt: "Coffee on a café table" },
  "pl-night-born": { src: media.tapas, alt: "A bar in the Born at night" },
  "pl-night-poble": { src: media.tapas, alt: "Evening drinks in Poble-sec" },
  "pl-night-gracia": { src: media.tapas, alt: "A neighbourhood bar in Gràcia" },
  "pl-flamenco": { src: media.batllo, alt: "An ornate performance hall" },
  "pl-cinema": { src: media.interior, alt: "A restored cinema interior" },
  "pl-picnic": { src: media.guell, alt: "A green spot for a picnic" },
};

const byCategory: Record<Place["category"], { src: string; alt: string }> = {
  restaurant: { src: media.tapas, alt: "A Barcelona restaurant table" },
  cafe: { src: media.interior, alt: "A café interior in Barcelona" },
  nightlife: { src: media.tapas, alt: "A bar counter in the evening" },
  culture: { src: media.interior, alt: "A cultural venue interior" },
  shopping: { src: media.boqueria, alt: "A market hall in Barcelona" },
  outdoors: { src: media.montjuic, alt: "Gardens and terraces in Barcelona" },
  market: { src: media.boqueria, alt: "Market stalls in Barcelona" },
};

export function placePhoto(place: Place) {
  return byId[place.id] ?? byCategory[place.category];
}
