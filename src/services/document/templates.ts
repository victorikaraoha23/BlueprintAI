export const CANONICAL_SECTIONS = [
  "Overview",
  "Problem Statement",
  "Goals and Objectives",
  "Requirements",
  "Architecture",
  "Technical Design",
  "Implementation Plan",
  "Testing Strategy",
  "Deployment",
  "Security Considerations",
  "Maintenance and Support",
] as const;

export interface DocumentSection {
  id: string;
  title: string;
  body: string;
  order: number;
}

export interface DocumentStructure {
  sections: DocumentSection[];
  structure_version: number;
}

export function createDefaultDocumentStructure(content?: Partial<Record<string, string>>): DocumentStructure {
  const sections: DocumentSection[] = CANONICAL_SECTIONS.map((title, index) => ({
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title,
    body: content?.[title] || "",
    order: index,
  }));

  return {
    sections,
    structure_version: 1,
  };
}

export function validateDocumentStructure(doc: DocumentStructure): boolean {
  const sectionIds = new Set(doc.sections.map((s) => s.id));
  return CANONICAL_SECTIONS.every((title) => {
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return sectionIds.has(id);
  });
}
