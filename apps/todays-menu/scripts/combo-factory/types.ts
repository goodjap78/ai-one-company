export type ComboAssetStatus =
  | 'approved'
  | 'existing_unregistered'
  | 'queued'
  | 'missing'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'processing';

export type ComboManifestEntry = {
  comboId: string;
  imageKey: string;
  title: string;
  comboKind: string;
  items: string[];
  transformationName?: string;
  assemblyGuide?: string[];
  outputFilename: string;
  promptFile: string;
  status: ComboAssetStatus;
  fileExists: boolean;
  registryHasKey: boolean;
};

export type ComboManifest = {
  generatedAt: string;
  sprint: string;
  pilotOnly?: boolean;
  scope?: 'pilot' | 'hack-all';
  total: number;
  items: ComboManifestEntry[];
};

export type ComboQueueItem = {
  comboId: string;
  imageKey: string;
  title: string;
  comboKind: string;
  items: string[];
  outputFilename: string;
  promptFile: string;
  status: ComboAssetStatus;
  updatedAt: string;
  error?: string;
  candidateFile?: string;
};

export type ComboQueueFile = {
  generatedAt: string;
  sprint: string;
  pilotOnly?: boolean;
  scope?: 'pilot' | 'hack-all';
  providerHint: string;
  missingOnly: boolean;
  totals: {
    total: number;
    approved: number;
    existing_unregistered: number;
    queued: number;
    missing: number;
    completed: number;
    failed: number;
    rejected: number;
    processing: number;
  };
  items: ComboQueueItem[];
};
