import type { WineType } from '../types/wine';
import { storage } from './storage';

interface WineInfo {
  grapes: string;
  country: string;
  region: string;
  type: WineType;
  bestBefore: string;
  tasteProfile: string;
  pairingAdvice: string;
}

export async function fetchWineInfo(
  wineName: string,
  year: number,
  existingGrapes?: string
): Promise<WineInfo> {
  const apiKey = storage.getApiKey();

  if (!apiKey) {
    throw new Error('Geen OpenAI API key ingesteld');
  }

  const prompt = `Je bent een wijnexpert. Geef informatie over de volgende wijn:

Naam: ${wineName}
Jaar: ${year}
${existingGrapes ? `Druif: ${existingGrapes}` : ''}

Geef de informatie in het volgende JSON formaat (in het Nederlands):
{
  "grapes": "de druivensoort(en)",
  "country": "land van herkomst",
  "region": "regio/appellation",
  "type": "rood" of "wit" of "rosé" of "bruisend",
  "bestBefore": "beste drink periode (bijv. '2024-2030')",
  "tasteProfile": "korte beschrijving van smaak en aroma's",
  "pairingAdvice": "aanbevolen gerechten om bij te serveren"
}

Antwoord ALLEEN met de JSON, geen extra tekst.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API fout');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Geen antwoord van OpenAI');
  }

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Geen JSON gevonden in antwoord');
    }
    const wineInfo = JSON.parse(jsonMatch[0]) as WineInfo;

    // Valideer type
    const validTypes: WineType[] = ['rood', 'wit', 'rosé', 'bruisend'];
    if (!validTypes.includes(wineInfo.type)) {
      wineInfo.type = 'rood'; // fallback
    }

    return wineInfo;
  } catch {
    throw new Error('Kon wijn informatie niet verwerken');
  }
}
