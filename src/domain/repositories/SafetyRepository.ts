export interface SafetyRepository {
  block(targetId: number): Promise<void>;
  report(targetId: number, reason: string, photoId?: number): Promise<void>;
}
