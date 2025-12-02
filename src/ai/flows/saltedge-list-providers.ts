
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { saltEdgeRequest } from './saltedge-api-helper';

const ListProvidersInputSchema = z.object({
  includeSandboxes: z.boolean().optional().default(false).describe("Include fake/sandbox providers for testing."),
  countryCode: z.string().optional().describe("Filter providers by country code (e.g., 'XF' for fake providers)."),
});

const ListProvidersOutputSchema = z.object({
  providers: z.array(z.object({
    code: z.string(),
    name: z.string(),
    mode: z.string().optional(),
    status: z.string().optional(),
    country_code: z.string().optional(),
  })),
});

export type ListProvidersInput = z.infer<typeof ListProvidersInputSchema>;
export type ListProvidersOutput = z.infer<typeof ListProvidersOutputSchema>;

export async function listSaltEdgeProviders(
  input: ListProvidersInput = {}
): Promise<ListProvidersOutput> {
  return listSaltEdgeProvidersFlow(input);
}

const listSaltEdgeProvidersFlow = ai.defineFlow(
  {
    name: 'listSaltEdgeProvidersFlow',
    inputSchema: ListProvidersInputSchema,
    outputSchema: ListProvidersOutputSchema,
  },
  async (input) => {
    try {
      const { includeSandboxes, countryCode } = input;
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (includeSandboxes) {
        params.append('include_sandboxes', 'true');
      }
      
      if (countryCode) {
        params.append('country_code', countryCode);
      }

      const endpoint = `/providers${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await saltEdgeRequest('GET', endpoint);

      return { providers: response.data || [] };
    } catch (error: any) {
      console.error('Error in listSaltEdgeProvidersFlow:', error);
      throw error;
    }
  }
);

