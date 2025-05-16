
// This file can be used for global type definitions.
// For now, most types are co-located with their respective features (e.g., form definitions in config/forms.ts)

export interface UserProfile {
  id: string;
  email?: string | null;
  idGerente?: string | null; // Specific to Metalgalvano
  // Add other profile fields as needed
}

// Example of a more complex type that might be shared
export interface ReportDocument {
  id: string;
  formType: string;
  formData: Record<string, any>;
  createdAt: Date;
  pdfUrl?: string; // Link to PDF in Firebase Storage
  submittedBy: string; // User ID
}
