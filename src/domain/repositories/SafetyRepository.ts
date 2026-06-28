export interface SafetyRepository {
  block(targetId: number): Promise<void>;
  report(targetId: number, reason: string): Promise<void>;
}
