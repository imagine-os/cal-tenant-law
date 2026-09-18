import { useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import type { CaseRow } from '../../data/schema/ops';

/**
 * The signed-in tenant's case. A super admin previewing the client app has no case of their own, so the demo
 * client's case is shown instead (demo convenience only - the RLS intent on `cases` is client_user_id = auth.uid()).
 */
export function useMyCase(): { clientId: string; myCase: CaseRow | null; caseId: string } {
  const { user, role } = useSession();
  const clientId = role === 'client' ? user.id : 'usr_client';
  const { rows } = useTable<CaseRow>('cases', { where: { client_user_id: clientId }, orderBy: { column: 'opened_at', dir: 'desc' } });
  const myCase = rows[0] ?? null;
  return { clientId, myCase, caseId: myCase?.id ?? '__none__' };
}
