import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from '../../atom/Button/Button';

function Boom(): JSX.Element { throw new Error('Demo: E.lines is not iterable'); }
function Demo() {
  const [broken, setBroken] = useState(false);
  return h(ErrorBoundary, { resetKey: String(broken), children: broken ? h(Boom) : h(Button, { variant: 'secondary', onClick: () => setBroken(true) }, 'Throw inside the boundary') });
}

export default defineMeta({
  tier: 'organism', name: 'ErrorBoundary', description: 'Per-page error boundary mounted by App around every route: a render error shows an EmptyState with Try again / Back to hub instead of unmounting the whole app.',
  props: [{ name: 'resetKey', type: 'string', description: 'Changing it clears the error (App passes the route path)' }, { name: 'label', type: 'string', description: 'Title override' }],
  states: ['children', 'error'],
  usages: [{ title: 'Catches a thrown render', render: () => h(Demo) }],
  a11y: ['role=alert on the fallback; the message and stack are real text.'],
  usedBy: ['HUB-01', 'F-12', 'C-39'],
});
