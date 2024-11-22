import axios from 'axios';
import { SearchResult } from './types';
import { SEARX_INSTANCES, RETRY_OPTIONS, API_TIMEOUT, MAX_RESULTS } from './config';
import { withRetry, sanitizeResponse } from './utils';
import { getFallbackResults } from './fallbackService';

const axiosInstance = axios.create({
  timeout: API_TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://searx.tiekoetter.com/'
  },
});

interface SearxResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    snippet?: string;
  }>;
}

async function querySingleInstance(
  query: string,
  instance: string,
  attempt: number = 0
): Promise<SearchResult[]> {
  try {
    const response = await axiosInstance.get<SearxResponse>(`${instance}/search`, {
      params: {
        q: query,
        format: 'json',
        language: 'en',
        categories: 'general',
        time_range: 'year',
        safesearch: 1
      },
      timeout: API_TIMEOUT * (attempt + 1),
    });

    const data = sanitizeResponse(response.data);

    if (!data?.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from search instance');
    }

    return data.results
      .filter(result => 
        result.title?.trim() && 
        result.url?.trim() && 
        (result.content?.trim() || result.snippet?.trim())
      )
      .map(result => ({
        title: String(result.title).trim(),
        url: String(result.url).trim(),
        content: String(result.content || result.snippet).trim(),
      }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`SearxNG instance ${instance} failed:`, errorMessage);
    throw error;
  }
}

export async function searchAcrossInstances(query: string): Promise<SearchResult[]> {
  const errors: string[] = [];
  const shuffledInstances = [...SEARX_INSTANCES].sort(() => Math.random() - 0.5);
  
  for (const instance of shuffledInstances) {
    for (let attempt = 0; attempt < RETRY_OPTIONS.maxRetries; attempt++) {
      try {
        const results = await querySingleInstance(query, instance, attempt);
        
        if (results && results.length > 0) {
          return results.slice(0, MAX_RESULTS);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${instance} (attempt ${attempt + 1}): ${errorMessage}`);
        
        if (attempt < RETRY_OPTIONS.maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, RETRY_OPTIONS.delayMs * Math.pow(2, attempt))
          );
        }
        continue;
      }
    }
  }

  throw new Error(`All SearxNG instances failed:\n${errors.join('\n')}`);
}