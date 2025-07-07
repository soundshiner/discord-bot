// utils/yoda.js
export function yodaify (message) {
  const templates = [
    `"${message}", hmmm.`,
    `Hmmm. ${message}, dire je dois.`,
    `Très intéressant, ce "${message}" est.`,
    `Le chemin vers la Force, dans "${message}" il se trouve.`,
    `Oui. "${message}", ainsi cela doit être.`,
    `Danser tu dois, car "${message}".`,
    `"${message}"... la patience, tu apprendras.`,
    `"${message}", jeune padawan... peu sage, cela est.`
  ];

  const index = Math.floor(Math.random() * templates.length);
  return templates[index];
}
