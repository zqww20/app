import React, { createContext, useContext, useMemo, useState } from "react";
import { load } from "../store/db.js";
import { capabilitiesFor, can as canCap, hasSignoff as hasSignoffFn, roleLabels } from "./permissions.js";

/* Who is acting, and what they're allowed to do. The role switcher lets   */
/* a reviewer step between staff to see role-tuned views and the sign-off  */
/* gate. Sign-off authority is a property of the user, always explicit.    */

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  // Users are read-only reference for the prototype; load a snapshot once.
  const users = useMemo(() => load().users || [], []);
  const [currentUserId, setCurrentUserId] = useState("u_broker");

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || null;

  const value = useMemo(() => {
    return {
      users,
      currentUser,
      setCurrentUserId,
      hasSignoff: hasSignoffFn(currentUser),
      can: (cap) => canCap(currentUser, cap),
      capabilities: capabilitiesFor(currentUser),
      roleLabels: roleLabels(currentUser),
    };
  }, [users, currentUser]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
