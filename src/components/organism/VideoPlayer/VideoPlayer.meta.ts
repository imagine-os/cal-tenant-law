import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { VideoPlayer } from './VideoPlayer';
import { Button } from '../../atom/Button/Button';

const labels = { play: 'Play', pause: 'Pause', back: 'Back 10s', forward: 'Forward 10s', progress: 'Watched so far', captions: 'Captions and Spanish subtitles come from YouTube\'s own player (CC button).' };

export default defineMeta({
  tier: 'organism', name: 'VideoPlayer',
  description: 'The in-app lesson player (C-42). A youtube-nocookie.com iframe driven through the YouTube IFrame API\'s postMessage channel - no third-party script is loaded and nothing autoplays - which reports how far the person actually watched so `lesson_progress.watched_pct` is measured, not self-declared (about every ten seconds, plus on pause and on end). Built for a TV remote first: one primary action, three large buttons, the page\'s own Previous / Next lesson buttons in the same row, Space for play / pause and the arrow keys for the lesson before and after.',
  props: [
    { name: 'youtubeId', type: 'string', required: true, description: 'Video id; the embed host is always youtube-nocookie.com' },
    { name: 'title', type: 'string', required: true, description: 'Iframe title and progress label' },
    { name: 'startSeconds', type: 'number', default: '0', description: 'Resume position for a half-watched lesson' },
    { name: 'durationSeconds', type: 'number | null', description: 'Known length from the lessons table, so the bar and the clock are right before the first message arrives' },
    { name: 'onProgress', type: '(pct, seconds, duration) => void', description: 'Every ~10 s of playback and on pause / end; the page writes lesson_progress' },
    { name: 'onEnded', type: '() => void', description: 'Player state 0' },
    { name: 'onPrev', type: '() => void', description: 'Left arrow and the page\'s Previous button' },
    { name: 'onNext', type: '() => void', description: 'Right arrow and the page\'s Next button' },
    { name: 'controls', type: 'ReactNode', description: 'Page buttons that belong in the same 10-foot row (Previous / Next lesson, Mark as watched)' },
    { name: 'labels', type: '{ play, pause, back, forward, progress, captions? }', required: true, description: 'Strings from the page\'s useT(), so the library component stays language-free' },
    { name: 'reportEvery', type: 'number', default: '10', description: 'Seconds between progress writes' },
  ],
  states: ['paused (initial - never autoplays)', 'playing', 'resumed part way', 'ended (writes 100%)', 'with the page\'s Previous / Next buttons', '10-foot control row at >= 1920', 'dark theme'],
  usages: [
    { title: 'Player with the page\'s lesson buttons', render: () => h(VideoPlayer, {
      youtubeId: 'RkyQOn9Lh40', title: 'The Game Board', labels,
      controls: [h(Button, { key: 'p', size: 'lg', variant: 'secondary', icon: 'chevron-left' }, 'Previous'), h(Button, { key: 'n', size: 'lg', variant: 'secondary', iconRight: 'chevron-right' }, 'Next lesson')],
    }) },
    { title: 'Resumed at 4:00, reporting every 5 s', render: () => h(VideoPlayer, { youtubeId: 'nr9f0kzNS0g', title: 'Demurrer', startSeconds: 240, reportEvery: 5, labels }) },
  ],
  a11y: ['Every control is a real Button with a visible label (never an icon alone), at least 44 px and larger again at TV widths.', 'Space plays and pauses unless focus is in a field or on another button; the arrow keys move to the previous / next lesson, so the whole player works from a d-pad.', 'Progress is a labelled ProgressBar with the percentage in text, and the clock reads "12:48 / 42:58" next to it.', 'Nothing autoplays (RULE-LEARN-06): sound never starts without a person asking for it.', 'The iframe carries a title; captions are YouTube\'s own and the page says so.'],
  usedBy: ['C-42'],
});
