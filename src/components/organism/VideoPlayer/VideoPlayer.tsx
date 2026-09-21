import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../../atom/Button/Button';
import { Icon } from '../../atom/Icon/Icon';
import { ProgressBar } from '../../atom/ProgressBar/ProgressBar';
import './VideoPlayer.css';

const ORIGINS = ['https://www.youtube-nocookie.com', 'https://www.youtube.com'];
const EMBED = 'https://www.youtube-nocookie.com';

export interface VideoPlayerLabels {
  play: string; pause: string; back: string; forward: string; progress: string;
  /** "Captions and Spanish subtitles come from YouTube's own player." */
  captions?: string;
}

export interface VideoPlayerProps {
  /** YouTube video id; the embed is always youtube-nocookie.com. */
  youtubeId: string;
  /** Used for the iframe title and the progress label. */
  title: string;
  /** Second to start at (a half-watched lesson resumes). */
  startSeconds?: number;
  /** Known length from the lessons table, so the bar and the clock read right before the first message arrives. */
  durationSeconds?: number | null;
  /** Poster shown before the person presses Play (the lesson's real thumbnail); a drawn poster stands in when absent or broken. */
  posterSrc?: string | null;
  /** Called about every ten seconds of playback and on pause / end: percentage, position and length. */
  onProgress?: (pct: number, seconds: number, duration: number) => void;
  onEnded?: () => void;
  /** Left / right arrow keys and the outer control buttons the page passes in `controls`. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Page buttons that sit in the same 10-foot control row (Previous / Next lesson, Mark as watched). */
  controls?: ReactNode;
  labels: VideoPlayerLabels;
  /** Seconds between progress writes (default 10). */
  reportEvery?: number;
  className?: string;
}

interface Info { currentTime?: number; duration?: number; playerState?: number }

/**
 * The in-app player (C-42). Click-to-play: until the person presses Play the component shows the lesson's poster and
 * a large Play button and loads nothing from YouTube (no third-party frame, cookies, storage or console noise before
 * intent; RULE-LEARN-05). Play creates a youtube-nocookie iframe driven through the YouTube IFrame API's postMessage
 * channel: no third-party script is loaded and the page is told how far the person actually watched so
 * `lesson_progress` is real instead of a "mark as watched" checkbox. Built for a TV remote first: one primary
 * action, three big buttons, arrow keys for the previous / next lesson and Space for play / pause.
 */
export function VideoPlayer({
  youtubeId, title, startSeconds = 0, durationSeconds = null, posterSrc = null, onProgress, onEnded, onPrev, onNext, controls, labels, reportEvery = 10, className = '',
}: VideoPlayerProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  /** The iframe exists only after the person asked for the video (click-to-play). A new lesson starts on its poster again. */
  const [armed, setArmed] = useState(false);
  const [posterBroken, setPosterBroken] = useState(false);
  useEffect(() => { setArmed(false); setPosterBroken(false); }, [youtubeId]);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(startSeconds);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const lastReport = useRef(-1);
  const state = useRef({ seconds: startSeconds, duration: durationSeconds ?? 0 });

  const command = useCallback((func: string, args: unknown[] = []) => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args, id: 1, channel: 'widget' }), EMBED);
  }, []);

  /** The handshake that makes the embed send infoDelivery messages back. */
  const listen = useCallback(() => {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), EMBED);
  }, []);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setInterval(listen, 1000);
    window.setTimeout(() => window.clearInterval(timer), 8000);
    return () => window.clearInterval(timer);
  }, [listen, youtubeId, armed]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!ORIGINS.includes(e.origin) || typeof e.data !== 'string') return;
      let payload: { event?: string; info?: Info | number };
      try { payload = JSON.parse(e.data) as { event?: string; info?: Info | number }; } catch { return; }
      const info = (typeof payload.info === 'object' ? payload.info : null) as Info | null;
      const playerState = info?.playerState ?? (payload.event === 'onStateChange' && typeof payload.info === 'number' ? payload.info : undefined);
      if (playerState != null) {
        setPlaying(playerState === 1);
        if (playerState === 0) { onEnded?.(); onProgress?.(100, state.current.duration, state.current.duration); }
        if (playerState === 2 && state.current.duration > 0) onProgress?.(pctOf(state.current.seconds, state.current.duration), state.current.seconds, state.current.duration);
      }
      if (info?.duration != null && info.duration > 0 && info.duration !== state.current.duration) { state.current.duration = info.duration; setDuration(info.duration); }
      if (info?.currentTime != null) {
        state.current.seconds = info.currentTime;
        setSeconds(info.currentTime);
        const bucket = Math.floor(info.currentTime / reportEvery);
        if (bucket !== lastReport.current && state.current.duration > 0) {
          lastReport.current = bucket;
          onProgress?.(pctOf(info.currentTime, state.current.duration), info.currentTime, state.current.duration);
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onEnded, onProgress, reportEvery]);

  /** First press: create the iframe with autoplay (a user gesture, so the browser allows it) and treat it as playing. */
  const start = useCallback(() => { setArmed(true); setPlaying(true); }, []);
  const toggle = useCallback(() => {
    if (!armed) { start(); return; }
    command(playing ? 'pauseVideo' : 'playVideo'); setPlaying((p) => !p);
  }, [armed, start, command, playing]);
  const seek = useCallback((delta: number) => {
    if (!armed) { start(); return; }
    command('seekTo', [Math.max(0, state.current.seconds + delta), true]);
  }, [armed, start, command]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName ?? '';
      if (el?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === ' ' && !['BUTTON', 'A'].includes(tag)) { e.preventDefault(); toggle(); return; }
      if (e.key === 'ArrowRight' && onNext) { e.preventDefault(); onNext(); }
      if (e.key === 'ArrowLeft' && onPrev) { e.preventDefault(); onPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, onNext, onPrev]);

  // autoplay=1 is only ever set after the person pressed Play (the gesture that allows it); the poster state loads nothing
  const src = `${EMBED}/embed/${encodeURIComponent(youtubeId)}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&autoplay=1&cc_load_policy=1`
    + `&start=${Math.floor(startSeconds)}&origin=${encodeURIComponent(typeof window === 'undefined' ? '' : window.location.origin)}`;

  return (
    <div className={`vplayer ${className}`} data-armed={armed ? 'true' : 'false'}>
      <div className="vplayer-frame">
        {armed ? (
          <iframe
            ref={frame} src={src} title={title} onLoad={listen}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className="vplayer-poster" onClick={start} aria-label={`${labels.play}: ${title}`}>
            {posterSrc && !posterBroken
              ? <img className="vplayer-poster-img" src={posterSrc} alt="" decoding="async" onError={() => setPosterBroken(true)} />
              : <span className="vplayer-poster-art" aria-hidden><span className="vplayer-poster-title">{title}</span></span>}
            <span className="vplayer-poster-play" aria-hidden><Icon name="play" size={36} strokeWidth={2} /></span>
            {startSeconds > 0 && <span className="vplayer-poster-resume">{clock(startSeconds)}</span>}
          </button>
        )}
      </div>
      <ProgressBar value={duration > 0 ? pctOf(seconds, duration) : 0} label={labels.progress} size="sm" showValue />
      <div className="vplayer-controls">
        <Button variant="outline" size="lg" icon="chevron-left" onClick={() => seek(-10)}>{labels.back}</Button>
        <Button variant="primary" size="lg" icon={playing ? undefined : 'play'} onClick={toggle} className="vplayer-primary">{playing ? labels.pause : labels.play}</Button>
        <Button variant="outline" size="lg" icon="chevron-right" onClick={() => seek(10)}>{labels.forward}</Button>
        {controls}
      </div>
      <p className="vplayer-time">
        <span className="vplayer-clock">{clock(seconds)}{duration > 0 ? ` / ${clock(duration)}` : ''}</span>
        {labels.captions && <span className="vplayer-captions">{labels.captions}</span>}
      </p>
    </div>
  );
}

const pctOf = (seconds: number, duration: number): number => Math.max(0, Math.min(100, Math.round((seconds / duration) * 100)));
/** "12:48" / "1:02:11". */
export function clock(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}
