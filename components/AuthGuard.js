"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity } from "lucide-react";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then((response) => {
      if (!response.ok) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setReady(true);
    }).catch(() => router.replace("/login"));
  }, [pathname, router]);

  if (!ready) return <main className="auth-loading"><Activity size={19} />Checking your secure session...</main>;
  return children;
}
