import { PhoneShell } from "@/components/layout/PhoneShell";
import { SuccessScreen } from "@/components/screens/Success";

export default function SuccessPage() {
  return (
    <PhoneShell>
      <div className="flex-1 overflow-y-auto">
        <SuccessScreen />
      </div>
    </PhoneShell>
  );
}
