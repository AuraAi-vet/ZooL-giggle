import { Pet, HealthRecord } from '../types';

/**
 * Mapped Schema for Pet data representation to minimize tokens
 */
export interface MinifiedPet {
  i: string;  // id
  n: string;  // name
  t: string;  // type/species
  b: string;  // breed
  a: number;  // age
  w: number;  // weight
}

/**
 * Mapped Schema for HealthRecord data representation to minimize tokens
 */
export interface MinifiedHealthRecord {
  i: string;   // id
  p: string;   // petId
  d: string;   // date (YY-MM-DD)
  t: string;   // type
  tl: string;  // title
  ds: string;  // description
  rx?: string; // prescription
}

/**
 * Utility to prune filler, auxiliary, and common conversational words
 * from descriptions and transcripts to save additional tokens 
 * while maintaining core medical and diagnostic semantics.
 */
export const pruneFillerText = (text: string | undefined): string => {
  if (!text) return "";
  
  // Strip HTML elements and clean whitespace
  let cleaned = text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Prune verbose auxiliary phrases or filler words that do not change diagnostic accuracy
  const fillerRegex = /\b(the|a|an|and|or|but|if|of|to|in|for|with|on|at|by|from|about|has|have|had|been|were|was|are|is|extremely|very|greatly|basically|actually|essentially|quite|somewhat|literally|personally|overall|generally)\b/gi;
  
  cleaned = cleaned.replace(fillerRegex, '');
  
  // Collapse duplicate spaces created during filtering
  return cleaned.replace(/\s+/g, ' ').trim();
};

/**
 * Formats full ISO/Timestamp dates into compact YY-MM-DD
 */
export const compactDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Return normalized raw fallback if date string parsing is atypical
      return dateStr.substring(2, 10).replace(/[-:]/g, '');
    }
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  } catch {
    return dateStr || "";
  }
};

/**
 * Main prompt data optimization framework
 */
export class PromptOptimizer {
  /**
   * Compresses pet profiles down to 6 key diagnostic variables
   */
  static minifyPet(pet: Pet): MinifiedPet {
    return {
      i: pet.id || "",
      n: pet.name || "",
      t: pet.type || "",
      b: pet.breed || "",
      a: pet.age || 0,
      w: pet.weight ? Math.round(pet.weight * 10) / 10 : 0
    };
  }

  /**
   * Compresses medical records down to diagnostic vitals and summaries,
   * completely stripping files, status trackers and unverified IDs.
   */
  static minifyHealthRecord(record: HealthRecord): MinifiedHealthRecord {
    const min: MinifiedHealthRecord = {
      i: record.id || "",
      p: record.petId || "",
      d: compactDate(record.date),
      t: record.type || "other",
      tl: record.title || "",
      ds: pruneFillerText(record.description)
    };
    if (record.prescription) {
      min.rx = pruneFillerText(record.prescription);
    }
    return min;
  }

  /**
   * Standardizes full patient dashboard context into compressed structure
   */
  static minifyPatientContext(pets: Pet[], records: HealthRecord[]): string {
    const miniPets = (pets || []).map(p => this.minifyPet(p));
    const miniRecords = (records || []).map(r => this.minifyHealthRecord(r));
    
    return JSON.stringify({
      pets: miniPets,
      records: miniRecords
    });
  }

  /**
   * Generates systemic instructions detailing the minified legend for Gemini to interpret seamlessly
   */
  static getOptimizedMappingLegend(): string {
    return [
      "PATIENT HEALTH SCHEMAS COMPRESSED CONTEXT:",
      "Pets structure: i=id, n=name, t=type/species, b=breed, a=age, w=weight(kg).",
      "Records structure: i=id, p=petId, d=date(YY-MM-DD), t=type, tl=title, ds=clinical description, rx=prescription.",
      "Interpret and output diagnosis using original context labels for final user presentation directly."
    ].join(" ");
  }

  /**
   * Calculates token reduction metrics based on character counts (correlation is ~0.98 for English text content)
   */
  static getOptimizationStats(original: any): { 
    originalChars: number; 
    compressedChars: number; 
    percentSavings: number; 
  } {
    const origStr = JSON.stringify(original || {});
    const compStr = typeof original === 'string' ? original : JSON.stringify(
      Array.isArray(original) 
        ? original.map(item => {
            if ('breed' in item) return this.minifyPet(item);
            if ('clinicalNotes' in item || 'description' in item) return this.minifyHealthRecord(item);
            return item;
          })
        : original
    );

    const originalLength = origStr.length;
    const compressedLength = compStr.length;
    const savings = originalLength > 0 
      ? Math.round(((originalLength - compressedLength) / originalLength) * 100)
      : 0;

    return {
      originalChars: originalLength,
      compressedChars: compressedLength,
      percentSavings: savings
    };
  }
}
