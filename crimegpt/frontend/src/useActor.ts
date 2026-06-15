import { useEffect, useState } from 'react';
import { getRole, getActorName, setActor as persist, type Role } from './api';

// Reactive access to the signed-in officer (P4). Components re-render when the
// role/name is changed from the header (via the 'actorchange' event).
export function useActor() {
  const [role, setRoleState] = useState<Role>(getRole());
  const [name, setNameState] = useState<string>(getActorName());

  useEffect(() => {
    const handler = () => {
      setRoleState(getRole());
      setNameState(getActorName());
    };
    window.addEventListener('actorchange', handler);
    return () => window.removeEventListener('actorchange', handler);
  }, []);

  const update = (r: Role, n: string) => {
    persist(r, n);
    window.dispatchEvent(new Event('actorchange'));
  };

  // LEGAL_ADVISOR is read + analysis only; IO/SHO can edit/file/upload.
  const canWrite = role !== 'LEGAL_ADVISOR';
  return { role, name, update, canWrite };
}
