type PrartisSpeechItem = {
  speaker_id: string;
  type: "speech";
  text: string;
  start_ts: number;
  stop_ts: number;
};

// Simple random ID generator
function generateSpeakerId(): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 22 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

export function parsePrartisTranscriptToJSONL(raw: string): string {
  const lines = raw
    .split(/\n{2,}/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Map each unique speaker to a random ID once
  const speakerMap = new Map<string, string>();

  function getSpeakerId(speaker: string): string {
    return speaker;
    if (!speakerMap.has(speaker)) {
      speakerMap.set(speaker, generateSpeakerId());
    }
    return speakerMap.get(speaker)!;
  }

  let currentTimestamp = 0;
  const avgDuration = 8000; // arbitrary duration per utterance

  const items: PrartisSpeechItem[] = lines
    .map((line) => {
      const match = line.match(/^([A-Za-z]+):\s*(.+)$/);
      if (!match) return null;
      const [, speaker, text] = match;

      const speaker_id = getSpeakerId(speaker);
      const start_ts = currentTimestamp;
      const stop_ts = (currentTimestamp += avgDuration);

      return {
        speaker_id,
        type: "speech",
        text: text.trim(),
        start_ts,
        stop_ts,
      };
    })
    .filter(Boolean) as PrartisSpeechItem[];

  // Return JSONL
  return items.map((item) => JSON.stringify(item)).join("\n");
}
