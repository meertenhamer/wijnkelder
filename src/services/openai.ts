import type { Wine, WineType } from '../types/wine';
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

interface WineInfoDutch {
  druif: string;
  land: string;
  regio: string;
  soort: WineType;
  bestOpDronk: string;
  smaakprofiel: string;
  pairingAdvies: string;
}

interface FoodPairingResult {
  recommendations: {
    wine: Wine;
    reason: string;
    score: number;
  }[];
  generalAdvice: string;
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

// Voor de WineSearch pagina - geeft Nederlandse veldnamen terug
export async function getWineInfo(
  wineName: string,
  year: number,
  existingGrapes?: string
): Promise<WineInfoDutch> {
  const info = await fetchWineInfo(wineName, year, existingGrapes);

  return {
    druif: info.grapes,
    land: info.country,
    regio: info.region,
    soort: info.type,
    bestOpDronk: info.bestBefore,
    smaakprofiel: info.tasteProfile,
    pairingAdvies: info.pairingAdvice
  };
}

// Voor de FoodPairing pagina - zoekt wijnen uit de kelder die passen bij een gerecht
export async function getFoodPairing(
  dish: string,
  userWines: Wine[]
): Promise<FoodPairingResult> {
  const apiKey = storage.getApiKey();

  if (!apiKey) {
    throw new Error('Geen OpenAI API key ingesteld');
  }

  if (userWines.length === 0) {
    throw new Error('Je hebt nog geen wijnen in je kelder');
  }

  // Maak een lijst van de wijnen van de gebruiker
  const wineList = userWines.map((wine, index) =>
    `${index + 1}. ${wine.name} (${wine.year}) - ${wine.type || 'onbekend'} - ${wine.country || 'onbekend land'}, ${wine.region || 'onbekende regio'} - Smaak: ${wine.tasteProfile || 'onbekend'}`
  ).join('\n');

  const prompt = `Je bent een sommelier. Een gebruiker wil weten welke wijn uit zijn/haar kelder het beste past bij het volgende gerecht:

GERECHT: ${dish}

BESCHIKBARE WIJNEN IN DE KELDER:
${wineList}

Analyseer welke wijnen het beste passen bij dit gerecht. Geef maximaal 3 aanbevelingen, gerangschikt van beste match naar minst goede match.

Antwoord in het volgende JSON formaat:
{
  "recommendations": [
    {
      "wineIndex": 1,
      "reason": "Korte uitleg waarom deze wijn goed past",
      "score": 95
    }
  ],
  "generalAdvice": "Algemeen advies over wijn bij dit gerecht"
}

De wineIndex moet overeenkomen met het nummer in de lijst hierboven (1-indexed).
De score is een getal van 0-100 dat aangeeft hoe goed de match is.

Als geen enkele wijn echt goed past, geef dan de beste opties met lagere scores en leg uit waarom.

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
    const result = JSON.parse(jsonMatch[0]);

    // Map de wineIndex terug naar de werkelijke Wine objecten
    const recommendations = result.recommendations.map((rec: { wineIndex: number; reason: string; score: number }) => ({
      wine: userWines[rec.wineIndex - 1],
      reason: rec.reason,
      score: rec.score
    })).filter((rec: { wine: Wine | undefined }) => rec.wine !== undefined);

    return {
      recommendations,
      generalAdvice: result.generalAdvice
    };
  } catch {
    throw new Error('Kon aanbevelingen niet verwerken');
  }
}
