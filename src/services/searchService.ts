import { SearchResponse } from '../types';
import { searchAcrossInstances } from './searxService';
import { searchWithTavily } from './tavilyService';
import { getFallbackResults } from './fallbackService';
import { sanitizeResponse } from './utils';
import { SwarmController } from './agents/swarmController';

export class SearchError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'SearchError';
  }
}

const swarmController = new SwarmController();

export async function performSearch(
  query: string,
  onStatusUpdate?: (status: string) => void
): Promise<SearchResponse> {
  try {
    if (!query.trim()) {
      throw new SearchError('Search query cannot be empty');
    }

    // Use swarm to process the query with status updates
    const { research, article } = await swarmController.processQuery(query, onStatusUpdate);

    // Format the response
    const response: SearchResponse = {
      answer: article.content,
      sources: research.results.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
      })),
      provider: 'SearxNG'
    };

    return sanitizeResponse(response);
  } catch (swarmError) {
    console.warn('Swarm processing failed, falling back to direct search:', swarmError);
    onStatusUpdate?.('Falling back to direct search...');
    
    try {
      let searchResults;
      let provider = '';
      let errors = [];
      
      // Try SearxNG first
      try {
        searchResults = await searchAcrossInstances(query);
        provider = 'SearxNG';
      } catch (searxError) {
        errors.push(`SearxNG: ${searxError.message}`);
        
        // Try Tavily as first fallback
        try {
          searchResults = await searchWithTavily(query);
          provider = 'Tavily AI';
        } catch (tavilyError) {
          errors.push(`Tavily: ${tavilyError.message}`);
          
          // Try final fallback
          try {
            searchResults = await getFallbackResults(query);
            provider = 'DuckDuckGo & Wikipedia';
          } catch (fallbackError) {
            errors.push(`Fallback: ${fallbackError.message}`);
            throw new SearchError('All search services failed', { errors });
          }
        }
      }

      if (!searchResults || searchResults.length === 0) {
        throw new SearchError('No results found for the given query');
      }

      const response: SearchResponse = {
        answer: 'Based on the search results, here is what I found...',
        sources: searchResults.map(result => ({
          title: result.title,
          url: result.url,
          snippet: result.content,
        })),
        provider
      };

      return sanitizeResponse(response);
    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Search error details:', {
        query,
        error: error instanceof Error ? error.stack : error
      });
      
      throw new SearchError(errorMessage, error);
    }
  }
}