import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import type { LessonRow } from '../../data/schema/ops';
import type { IllustrationRow } from '../../data/schema/illustrations';
import { illustrationUrl } from '../../data/illustrationAssets';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Icon } from '../../components/atom/Icon/Icon';
import { SiteFrame } from './chrome';
import { videosSpec } from './specs';

/** The site's own grouping, in the site's own order; anything else (the three embedded on article pages) comes last. */
const GROUP_ORDER = ['Legal Videos', 'Winning Your Eviction Series', 'The Game Board Series'];

/** "27:48" from seconds; null when YouTube gave the scrape no duration. */
export const mmss = (s: number | null | undefined): string | null =>
  (s == null ? null : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

/** youtube-nocookie, no autoplay: the embed is created only when the visitor presses play, and sound starts only when they press play inside the player. */
const embedSrc = (youtubeId: string): string => `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`;

/**
 * P-06 - the public video library: the firm's 36 real videos from the `lessons` table in the site's three groups,
 * each with its thumbnail and length, an in-page youtube-nocookie player (one at a time, created on click, never
 * autoplaying), search, and a pointer to the client app where a signed-in tenant's progress is tracked.
 */
export function VideosPage() {
  const { t } = useI18n();
  const { hasRole } = useSession();
  const [query, setQuery] = useState('');
  const [playing, setPlaying] = useState<string | null>(null);
  const { rows: lessons } = useTable<LessonRow>('lessons', { orderBy: { column: 'order' } });
  const { rows: illustrations } = useTable<IllustrationRow>('illustrations');

  /** Thumbnail sources in order: the bundled scrape of the firm's own image (offline-safe), the one the firm's site serves, then YouTube's still. The card walks the list when one fails to load. */
  const thumbsFor = useMemo(() => {
    const byKey = new Map(illustrations.map((i) => [i.key, i.file]));
    return (l: LessonRow): string[] => [
      l.illustration_id ? illustrationUrl(byKey.get(l.illustration_id)) : null,
      l.thumbnail_url,
      l.youtube_id ? `https://i.ytimg.com/vi/${l.youtube_id}/hqdefault.jpg` : null,
    ].filter((x): x is string => !!x);
  }, [illustrations]);

  /** Only the firm's videos: the same table also holds the articles the client app's curriculum uses (kind = article). */
  const videos = useMemo(() => lessons.filter((l) => l.kind === 'video'), [lessons]);
  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? videos.filter((l) => `${l.title} ${l.group ?? ''} ${l.presenter ?? ''}`.toLowerCase().includes(q)) : videos),
    [videos, q],
  );

  const groups = useMemo(() => {
    const map = new Map<string, LessonRow[]>();
    for (const l of matches) {
      const g = l.group ?? t('p6.groupOther');
      const list = map.get(g) ?? [];
      list.push(l);
      map.set(g, list);
    }
    return [...map.entries()].sort((a, b) => {
      const ia = GROUP_ORDER.indexOf(a[0]), ib = GROUP_ORDER.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }, [matches, t]);

  useActions(videosSpec, {
    'site.searchVideos': ({ q: term }) => { setQuery(String(term ?? '')); return { ok: true, message: `Searching the library for "${String(term ?? '')}"` }; },
    'site.playVideo': ({ lessonId }) => {
      const hit = videos.find((l) => l.id === String(lessonId ?? '') || l.youtube_id === String(lessonId ?? ''));
      if (!hit?.youtube_id) return { ok: false, message: `No such video: ${String(lessonId)}` };
      setPlaying(hit.id);
      return { ok: true, message: `Playing ${hit.title}` };
    },
    'site.closeVideo': () => { setPlaying(null); return { ok: true, message: 'Closed the player' }; },
  });

  const card = (l: LessonRow) => {
    const isPlaying = playing === l.id;
    const length = mmss(l.duration_seconds);
    const thumbs = thumbsFor(l);
    return (
      <Card key={l.id} padding="sm" className="st-vidcard">
        <div className="st-vid">
          {isPlaying && l.youtube_id ? (
            <VideoPlayer youtubeId={l.youtube_id} title={l.title} />
          ) : (
            <VideoThumb
              srcs={thumbs} length={length} disabled={!l.youtube_id}
              label={`${t('p6.play')}: ${l.title}${length ? ` (${length})` : ''}`}
              onPlay={() => setPlaying(l.id)}
            />
          )}
          <h3 className="st-vid-title">{l.title}</h3>
          <div className="st-vid-meta">
            {length && <Badge tone="neutral" size="sm" variant="text">{length}</Badge>}
            {isPlaying && (
              <Button size="sm" variant="ghost" icon="close" onClick={() => setPlaying(null)}>{t('p6.close')}</Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <SiteFrame>
      <div className="container">
        <PageHeader
          code="P-06" eyebrow={t('p6.eyebrow')} title={t('p6.title')} subtitle={t('p6.lead')}
          actions={<SearchInput value={query} onChange={setQuery} label={t('p6.search')} placeholder={t('p6.searchPlaceholder')} className="st-vidsearch" />}
        />
      </div>

      <div className="container">
        <Card tint>
          <div className="st-vid-note">
            <span className="st-icon-badge"><Icon name="play" size={20} /></span>
            <div className="stack-sm">
              <p className="st-body">{t('p6.trackNote')}</p>
              {hasRole(['client', 'super_admin'])
                ? <div><Link to="/app/learn"><Button variant="secondary" size="sm" iconRight="arrow-right">{t('p6.trackLink')}</Button></Link></div>
                : <p className="xs muted">{t('p6.trackSignedOut')}</p>}
            </div>
          </div>
        </Card>
      </div>

      <div className="container">
        {groups.length === 0 ? (
          <EmptyState icon="video" title={t('p6.empty.title')} body={t('p6.empty.body')} action={<Button variant="secondary" onClick={() => setQuery('')}>{t('p6.empty.clear')}</Button>} />
        ) : (
          groups.map(([group, rows]) => (
            <Section key={group} title={group} description={t('p6.groupCount', { n: rows.length })}>
              <div className="st-grid3 st-vidgrid">{rows.map(card)}</div>
            </Section>
          ))
        )}
      </div>

      <div className="container">
        <p className="xs muted">{t('p6.sourceNote', { n: videos.length })}</p>
      </div>
    </SiteFrame>
  );
}

/** The play target: the first thumbnail source that loads, falling through the list, then the video glyph when none does. */
function VideoThumb({ srcs, length, label, disabled, onPlay }: { srcs: string[]; length: string | null; label: string; disabled: boolean; onPlay: () => void }) {
  const [i, setI] = useState(0);
  const src = srcs[i] ?? null;
  return (
    <button type="button" className="st-vid-thumb" onClick={onPlay} aria-label={label} disabled={disabled}>
      {src
        ? <img key={src} src={src} alt="" loading="lazy" decoding="async" onError={() => setI((n) => n + 1)} />
        : <span className="st-vid-noimg" aria-hidden><Icon name="video" size={28} /></span>}
      <span className="st-vid-play" aria-hidden><Icon name="play" size={22} /></span>
      {length && <span className="st-vid-len">{length}</span>}
    </button>
  );
}

/** The embed, created only when the visitor pressed play. Focus moves into it so the keyboard follows the click. */
function VideoPlayer({ youtubeId, title }: { youtubeId: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="st-vid-player" ref={ref} tabIndex={-1}>
      <iframe
        src={embedSrc(youtubeId)} title={title} loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
