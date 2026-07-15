export interface PackDescriptor {
  readonly id: string;
  readonly label: string;
  readonly type: string;
  readonly system: string;
}

export interface PackSummary extends PackDescriptor {
  readonly packageName: string;
  readonly documentCount: number;
}
