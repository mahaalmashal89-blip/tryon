import { Suspense } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { AuthScreen } from "@/components/screens/Auth";

export default function AuthPage() {
  return (
    <PhoneShell>
      <div className="flex-1 overflow-y-auto">
        <Suspense>
          <AuthScreen />
        </Suspense>
      </div>
    </PhoneShell>
  );
}
