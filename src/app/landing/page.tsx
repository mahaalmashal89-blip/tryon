import { PhoneShell } from "@/components/layout/PhoneShell";
import { LandingScreen } from "@/components/screens/Landing";

export default function LandingPage() {
  return (
    <PhoneShell>
      <div className="flex-1 overflow-y-auto">
        <LandingScreen />
      </div>
    </PhoneShell>
  );
}
