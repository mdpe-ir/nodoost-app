/** دروازه‌ی یک امکانِ چندرسانه‌ای گفتگو — از `GET /api/config` `chat`. */
export interface ChatFeatureGate {
  enabled: boolean;
  minTier: number | null;
}

export interface ChatConfig {
  voice: ChatFeatureGate;
  photo: ChatFeatureGate;
  voiceMaxMs: number;
  voiceMinMs: number;
}

export const emptyChatConfig = (): ChatConfig => ({
  voice: { enabled: true, minTier: null },
  photo: { enabled: true, minTier: 3 },
  voiceMaxMs: 60_000,
  voiceMinMs: 800,
});

const gate = (raw: unknown): ChatFeatureGate => {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const min = o.min_tier;
  return {
    enabled: o.enabled !== false,
    minTier: typeof min === 'number' ? min : min === null ? null : null,
  };
};

/** پارسِ بلوکِ `chat` از `/api/config`. */
export const parseChatConfig = (raw: unknown): ChatConfig => {
  const base = emptyChatConfig();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  return {
    voice: gate(o.voice),
    photo: gate(o.photo),
    voiceMaxMs: typeof o.voice_max_ms === 'number' ? o.voice_max_ms : base.voiceMaxMs,
    voiceMinMs: typeof o.voice_min_ms === 'number' ? o.voice_min_ms : base.voiceMinMs,
  };
};

/** آیا کاربر با سطحِ مؤثر به این دروازه دسترسی دارد. */
export const chatGateOpen = (gate: ChatFeatureGate, myTier: number): boolean =>
  gate.enabled && (gate.minTier == null || myTier >= gate.minTier);
