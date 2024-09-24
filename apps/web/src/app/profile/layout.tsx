import { ReactNode } from "react";
import ProfileMenu from "@/components/ProfileMenu";
import ProfileMenuMobile from "@/components/ProfileMenuMobile";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: ProfileLayoutProps) {
  return (
    <main>
      <div className="flex flex-col sm:flex-row justify-center gap-6">
        <ProfileMenu/>
        <ProfileMenuMobile/>
        {children}
      </div>
    </main>
  );
}
