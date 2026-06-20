import { Suspense } from "react";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { ProfileSetupScreen } from "@/components/screens/ProfileSetup";

export default function ProfileSetupPage() {
  return (
    <PhoneShell>
      <div className="flex-1 overflow-y-auto">
        <Suspense>
          <ProfileSetupScreen />
        </Suspense>
      </div>
    </PhoneShell>
  );
}
