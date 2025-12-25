import { DictionaryEntry } from '../types';

/**
 * Fetches data from Google Sheets as CSV and converts it to an array of objects.
 */
export const fetchGoogleSheetData = async (sheetUrl: string): Promise<DictionaryEntry[]> => {
  if (!sheetUrl || !sheetUrl.startsWith('http')) return [];
  
  try {
    // Append timestamp to prevent caching
    const response = await fetch(`${sheetUrl}${sheetUrl.includes('?') ? '&' : '?'}t=${Date.now()}`);
    if (!response.ok) throw new Error('Could not connect to Google Sheets');
    
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.warn("Sheet Service Error:", error);
    return [];
  }
};

/**
 * Parses CSV text, handling quotes and nested commas.
 */
const parseCSV = (csvText: string): DictionaryEntry[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return []; 

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map((line, index) => {
    // Use Regex to split by comma not inside double quotes
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const values = line.split(regex).map(val => {
       return val.trim().replace(/^"|"$/g, '').replace(/""/g, '"');
    });

    // Column Order: id, akha, pronunciation, thai, english, category, tags, ex_akha, ex_thai, ex_english
    const [
        id, akha, pronunciation, thai, english, category, tags,
        exAkha, exThai, exEnglish
    ] = values;

    // Validation (must have at least Akha word and one translation)
    if (!akha || (!thai && !english)) return null;

    return {
      id: id || `auto-${index}`,
      akha: akha,
      akhaPronunciation: pronunciation || '',
      thai: thai || '',
      english: english || '',
      category: category || 'General',
      tags: tags ? tags.split('|').map(t => t.trim()) : [],
      exampleSentence: (exAkha || exThai || exEnglish) ? {
        akha: exAkha || '',
        thai: exThai || '',
        english: exEnglish || ''
      } : undefined
    } as DictionaryEntry;
  }).filter((entry): entry is DictionaryEntry => entry !== null);
};