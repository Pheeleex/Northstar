import WorkspaceShell from "@/shared/components/layout/WorkspaceShell";
import { DemoStoreProvider } from "@/shared/stores/DemoStoreProvider";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <DemoStoreProvider><WorkspaceShell>{children}</WorkspaceShell></DemoStoreProvider>;
}
