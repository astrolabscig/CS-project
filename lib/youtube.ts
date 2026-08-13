// AI-assisted video discovery (design doc: RecommendedVideo workflow).
// Server-only — calls the YouTube Data API v3 (search.list -> videos.list ->
// channels.list) and ranks results by a view/like/subscriber-based "quality
// score". This is explicitly NOT an editorial rating; the UI must say so.

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const FETCH_TIMEOUT_MS = 8000;
const MAX_SEARCH_RESULTS = 10;
const MAX_SUGGESTIONS = 5;

export class YoutubeApiError extends Error {}

export interface YoutubeSuggestion {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  viewCount: number;
  likeCount: number;
  qualityScore: number;
}

interface SearchItem {
  id?: { videoId?: string };
  snippet?: { title?: string };
}

interface VideoItem {
  id: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
  };
  statistics?: { viewCount?: string; likeCount?: string };
}

interface ChannelItem {
  id: string;
  statistics?: { subscriberCount?: string };
}

async function youtubeGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new YoutubeApiError('YouTube integration is not configured.');

  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  url.searchParams.set('key', apiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new YoutubeApiError('Could not reach YouTube right now.');
  }
  if (!response.ok) {
    // 403 on this API almost always means the daily quota was exhausted.
    if (response.status === 403) throw new YoutubeApiError('YouTube API quota reached — try again later.');
    throw new YoutubeApiError(`YouTube request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

/**
 * Searches YouTube for `query`, fetches statistics for the results, ranks
 * them by view/like/subscriber-based quality score, and returns the top
 * MAX_SUGGESTIONS — skipping any videoId already in `excludeVideoIds` (videos
 * already suggested, approved, or rejected for this course).
 */
export async function suggestVideosForCourse(query: string, excludeVideoIds: string[]): Promise<YoutubeSuggestion[]> {
  const excluded = new Set(excludeVideoIds);

  const search = await youtubeGet<{ items?: SearchItem[] }>('search', {
    part: 'snippet',
    q: query,
    type: 'video',
    relevanceLanguage: 'en',
    safeSearch: 'strict',
    maxResults: String(MAX_SEARCH_RESULTS),
  });

  const videoIds = (search.items ?? [])
    .map((item) => item.id?.videoId)
    .filter((id): id is string => typeof id === 'string' && !excluded.has(id));
  if (videoIds.length === 0) return [];

  const videos = await youtubeGet<{ items?: VideoItem[] }>('videos', {
    part: 'statistics,snippet',
    id: videoIds.join(','),
  });
  const videoItems = videos.items ?? [];
  if (videoItems.length === 0) return [];

  const channelIds = Array.from(
    new Set(videoItems.map((v) => v.snippet?.channelId).filter((id): id is string => Boolean(id)))
  );
  const subscriberCounts = new Map<string, number>();
  if (channelIds.length > 0) {
    try {
      const channels = await youtubeGet<{ items?: ChannelItem[] }>('channels', {
        part: 'statistics',
        id: channelIds.join(','),
      });
      for (const channel of channels.items ?? []) {
        subscriberCounts.set(channel.id, Number(channel.statistics?.subscriberCount ?? 0));
      }
    } catch {
      // Subscriber count is a ranking input, not a hard requirement — fall
      // back to view/like-only ranking rather than failing the whole suggest.
    }
  }

  const suggestions: YoutubeSuggestion[] = videoItems.map((v) => {
    const viewCount = Number(v.statistics?.viewCount ?? 0);
    const likeCount = Number(v.statistics?.likeCount ?? 0);
    const subscriberCount = v.snippet?.channelId ? subscriberCounts.get(v.snippet.channelId) ?? 0 : 0;
    // Log-scaled so one viral video or one huge channel can't dominate purely
    // on scale; likes weighted highest as the strongest engagement signal.
    const qualityScore =
      Math.log10(viewCount + 1) * 1 + Math.log10(likeCount + 1) * 2 + Math.log10(subscriberCount + 1) * 1.5;

    return {
      videoId: v.id,
      title: v.snippet?.title ?? 'Untitled video',
      channelName: v.snippet?.channelTitle ?? 'Unknown channel',
      thumbnailUrl:
        v.snippet?.thumbnails?.high?.url ?? v.snippet?.thumbnails?.medium?.url ?? v.snippet?.thumbnails?.default?.url ?? '',
      youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
      viewCount,
      likeCount,
      qualityScore,
    };
  });

  suggestions.sort((a, b) => b.qualityScore - a.qualityScore);
  return suggestions.slice(0, MAX_SUGGESTIONS);
}
