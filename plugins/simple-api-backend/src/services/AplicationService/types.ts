export interface AplicationItem {
  name: string;
  tecnology: string;
}

export interface AplicationService {
  listAplications(): Promise<AplicationItem[]>;
  createAplications(
    application: AplicationItem,
  ): Promise<{ status: string; data: AplicationItem }>;
}
