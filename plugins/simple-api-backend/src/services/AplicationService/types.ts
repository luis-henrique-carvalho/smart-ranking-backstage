export interface AplicationItem {
  name: string;
  technology: string;
}

export interface AplicationService {
  listAplications(): Promise<AplicationItem[]>;
  createAplications(
    application: AplicationItem,
  ): Promise<{ status: string; data: AplicationItem }>;
}
