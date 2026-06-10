import Papa from "papaparse";
import type { BoothCatalogEntry } from "../types";

function splitBilingualValue(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    thai: lines[0] ?? "",
    english: lines.slice(1).join(" ").trim(),
  };
}

function normalizeLogoUrl(value: string) {
  const candidate = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && line !== "-");

  return candidate ?? null;
}

function isBoothCode(value: string) {
  return /^[A-Z]+\d+(?:\/\d+)?$/i.test(value.trim());
}

export async function loadBoothCatalog(csvUrl: string): Promise<BoothCatalogEntry[]> {
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(`Unable to load booth catalog: ${response.status}`);
  }

  const text = await response.text();
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: true,
  });

  const entries: BoothCatalogEntry[] = [];
  let currentSection = "General";

  for (const row of parsed.data) {
    const cells = row.map((cell) => cell.trim());
    const [first = "", second = "", third = "", fourth = ""] = cells;

    if (!first) {
      continue;
    }

    if (!isBoothCode(first)) {
      currentSection = first;
      continue;
    }

    const company = splitBilingualValue(second);
    const brand = splitBilingualValue(third);

    entries.push({
      code: first,
      companyThai: company.thai,
      companyEnglish: company.english,
      brandThai: brand.thai,
      brandEnglish: brand.english,
      section: currentSection,
      logoUrl: normalizeLogoUrl(fourth),
    });
  }

  return entries;
}
