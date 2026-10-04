import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import { DemoStoreProvider } from "@/lib/demo-store";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <DemoStoreProvider><WorkspaceShell>{children}</WorkspaceShell></DemoStoreProvider>;
}
