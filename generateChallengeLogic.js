// netlify/functions/generateChallengeLogic.js

const axios = require('axios');
const Papa = require('papaparse');
const seedrandom = require('seedrandom');

async function generateChallenge(challengeNumber) {
  // Fetch data required for challenge generation
  const [locationData, countriesData, flagsColors, flagsSymbols] = await fetchData();

  // Generate a seed for deterministic randomness
  const seed = calculateSeedFromNumber(challengeNumber);
  const rng = seedrandom(seed);

  // Use your existing logic to generate the challenge
  const challenge = await createChallenge(locationData, seed, countriesData, rng, flagsColors, flagsSymbols);

  return challenge;
}

async function fetchData() {
  // Use environment variable or default to local URL
  const baseUrl = process.env.BASE_URL || 'http://localhost:8888';
  const citiesUrl = `${baseUrl}/worldcities.csv`;

  // URLs for flags data
  const flagsColorsUrl = 'https://hmqpuuvdemhxlezwpvwo.supabase.co/storage/v1/object/public/Flags/flagsColors.json';
  const flagsSymbolsUrl = 'https://hmqpuuvdemhxlezwpvwo.supabase.co/storage/v1/object/public/Flags/flagsSymbols.json';

  const [citiesResponse, countriesResponse, flagsColorsResponse, flagsSymbolsResponse] = await Promise.all([
    axios.get(citiesUrl),
    axios.get('https://restcountries.com/v3.1/all'),
    axios.get(flagsColorsUrl),
    axios.get(flagsSymbolsUrl),
  ]);

  // Parse CSV data
  const cities = Papa.parse(citiesResponse.data, { header: true }).data;
  const validCities = cities.filter(
    (city) => city.city_ascii && city.lat && city.lng && city.population
  );

  const countriesData = countriesResponse.data;

  const flagsColors = flagsColorsResponse.data;
  const flagsSymbols = flagsSymbolsResponse.data;

  return [validCities, countriesData, flagsColors, flagsSymbols];
}

function calculateSeedFromNumber(challengeNumber) {
  return challengeNumber.toString();
}

async function createChallenge(locationData, seed, countriesData, rng, flagsColors, flagsSymbols) {
  const levels = {
    Easy: locationData.filter((city) => parseInt(city.population) > 5000000),
    Medium: locationData.filter(
      (city) => parseInt(city.population) <= 5000000 && parseInt(city.population) > 1000000
    ),
    Hard: locationData.filter((city) => parseInt(city.population) <= 1000000),
  };

  const levelKeys = Object.keys(levels);
  const levelIndex = Math.floor(rng() * levelKeys.length);
  const level = levelKeys[levelIndex];
  const locationsInLevel = levels[level];

  if (!locationsInLevel || locationsInLevel.length === 0) {
    console.error(`No locations found for level ${level}`);
    return null;
  }

  let locationIndex = Math.floor(rng() * locationsInLevel.length);
  let location = locationsInLevel[locationIndex];

  let attempts = 0;
  while ((!location.lat || !location.lng) && attempts < locationsInLevel.length) {
    locationIndex = (locationIndex + 1) % locationsInLevel.length;
    location = locationsInLevel[locationIndex];
    attempts++;
  }

  if (!location || !location.lat || !location.lng) {
    console.error('Could not find a valid location');
    return null;
  }

  const countryName = location.country;
  const country = countriesData.find(
    (c) => c.name.common.toLowerCase() === countryName.toLowerCase()
  );

  const clues = generateClues(location, country, rng, flagsColors, flagsSymbols);

  return {
    id: parseInt(seed, 10),
    date: new Date().toISOString().split('T')[0],
    level: level,
    answer: location.city_ascii,
    answer_length: location.city_ascii.replace(/[^A-Za-z]/g, '').length,
    clues: clues,
    fact: `👑 The treasure is located in the city of ${location.city_ascii} in ${location.country}.`,
  };
}

function generateClues(location, country, rng, flagsColors, flagsSymbols) {
  const clues = [];

  // Clue 1: Either longitude or latitude
  if (rng() < 0.5) {
    // Latitude clue
    const lat = parseFloat(location.lat);
    const latDirection = lat >= 0 ? 'north' : 'south';
    clues.push(`Sail to the ${Math.abs(lat).toFixed(1)}° ${latDirection}.`);
  } else {
    // Longitude clue
    const lng = parseFloat(location.lng);
    const lngDirection = lng >= 0 ? 'east' : 'west';
    clues.push(`Head towards ${Math.abs(lng).toFixed(1)}° ${lngDirection}.`);
  }

  // Clue 2: Compass clue
  const compassClue = generateCompassClue(location);
  clues.push(compassClue);

  // Clue 3: Neighboring countries
  if (country && country.borders && country.borders.length > 0) {
    clues.push(`The land you're seeking is surrounded by ${country.borders.length} neighboring lands.`);
  } else {
    clues.push('The land you seek stands alone with no neighboring countries.');
  }

  // Clue 4: Flag colors or symbols
  const colors = getFlagColors(country, flagsColors);
  if (colors.length > 0) {
    clues.push(`Hoist the flag with colors of ${colors.join(', ')}.`);
  } else {
    const symbol = getFlagSymbols(country, rng, flagsSymbols);
    if (symbol) {
      clues.push(`Look for the flag bearing the ${symbol}.`);
    } else {
      clues.push('The flag bears unique symbols known to the locals.');
    }
  }

  // Clue 5: Language origin or script
  const languageClue = generateLanguageClue(country);
  if (languageClue) {
    clues.push(languageClue);
  } else {
    clues.push('The local tongue holds ancient secrets.');
  }

  return clues;
}

function generateCompassClue(location) {
  const lat = parseFloat(location.lat);
  const lng = parseFloat(location.lng);

  let clue = 'Your treasure lies';

  if (lat >= 45) {
    clue += ' in the cold northern realms.';
  } else if (lat <= -45) {
    clue += ' in the icy southern lands.';
  } else if (lng >= 90 || lng <= -90) {
    clue += ' in the far east or west.';
  } else {
    clue += ' somewhere in the temperate zones.';
  }

  return clue;
}

function getFlagColors(country, flagsColors) {
  if (!country || !country.name || !country.name.common) return [];
  const countryName = country.name.common;
  const colors = flagsColors[countryName];
  return colors || [];
}

function getFlagSymbols(country, rng, flagsSymbols) {
  if (!country || !country.name || !country.name.common) return null;
  const countryName = country.name.common;
  const symbolsList = flagsSymbols[countryName];
  if (symbolsList && symbolsList.length > 0) {
    // Randomize and pick one symbol
    const randomIndex = Math.floor(rng() * symbolsList.length);
    return symbolsList[randomIndex];
  }
  return null;
}

function generateLanguageClue(country) {
  if (!country || !country.languages) return null;
  const languages = Object.values(country.languages);
  if (languages.length === 0) return null;

  const language = languages[0]; // Taking the first language
  return `The local tongue traces back to the ${language} language family.`;
}

module.exports = { generateChallenge };
