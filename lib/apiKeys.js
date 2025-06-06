import { RAPID_API_KEY, APIFY_KEY, SCRAPE_NINJA_KEY } from '@env';

export const getRapidAPIKey = () => {
  if (!RAPID_API_KEY) {
    throw new Error('RAPID_API_KEY is not defined');
  }
  return RAPID_API_KEY;
};

export const getApifyKey = () => {
  if (!APIFY_KEY) {
    throw new Error('APIFY_KEY is not defined');
  }
  return APIFY_KEY;
};

export const getScrapeNinjaKey = () => {
  if (!SCRAPE_NINJA_KEY) {
    throw new Error('SCRAPE_NINJA_KEY is not defined');
  }
  return SCRAPE_NINJA_KEY;
};