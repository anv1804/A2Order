export interface WorkspaceCache<T> {
  key: string;
  value: T;
}

export interface DocumentResponse<T> {
  value: T | null;
  version: number;
}
