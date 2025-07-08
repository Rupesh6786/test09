
'use server';
/**
 * @fileOverview A flow for generating a tournament registration confirmation email.
 *
 * - generateConfirmationEmail - A function that generates the email subject and body.
 * - ConfirmationEmailInput - The input type for the generateConfirmationEmail function.
 * - ConfirmationEmailOutput - The return type for the generateConfirmationEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfirmationEmailInputSchema = z.object({
  userName: z.string().describe('The name of the player receiving the email.'),
  tournamentTitle: z.string().describe('The title of the tournament.'),
  matchDate: z.string().describe('The date of the match.'),
  matchTime: z.string().describe('The time of the match.'),
  entryFee: z.number().describe('The entry fee for the tournament.'),
  prizePool: z.number().describe('The prize pool for the tournament.'),
});
type ConfirmationEmailInput = z.infer<typeof ConfirmationEmailInputSchema>;

const ConfirmationEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email.'),
});
type ConfirmationEmailOutput = z.infer<typeof ConfirmationEmailOutputSchema>;

export async function generateConfirmationEmail(input: ConfirmationEmailInput): Promise<ConfirmationEmailOutput> {
  return generateConfirmationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateConfirmationEmailPrompt',
  input: {schema: ConfirmationEmailInputSchema},
  output: {schema: ConfirmationEmailOutputSchema},
  prompt: `You are an assistant for an esports platform called BattleBucks. 
  Your task is to generate a friendly and professional confirmation email for a player whose tournament registration has been approved.

  Generate a subject and a body for the email.

  The email should:
  - Congratulate the player, using their name: {{{userName}}}.
  - Confirm their spot in the tournament: {{{tournamentTitle}}}.
  - Clearly state the match date and time: {{{matchDate}}} at {{{matchTime}}}.
  - Remind them of the entry fee (₹{{{entryFee}}}) and the total prize pool (₹{{{prizePool}}}).
  - Have an exciting and encouraging tone.
  - End with a friendly closing.
  - The body should be formatted for an email, using newlines for paragraphs. Do not use Markdown.
  `,
});

const generateConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'generateConfirmationEmailFlow',
    inputSchema: ConfirmationEmailInputSchema,
    outputSchema: ConfirmationEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
