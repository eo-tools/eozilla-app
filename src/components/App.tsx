import { AppShell } from "@mantine/core";

import "./App.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Main from "@/components/Main";
import styles from "@/components/common/styles";
import {
  DEFAULT_APP_BRANDING,
  type AppBranding,
  type AppServiceConfig,
} from "@/config/bootstrap";

interface AppProps {
  compact?: boolean;
  branding?: AppBranding;
  configuredService?: AppServiceConfig;
}

export default function App({
  compact = false,
  branding = DEFAULT_APP_BRANDING,
  configuredService,
}: AppProps) {
  return (
    <AppShell
      withBorder={false}
      padding={styles.shell.py}
      header={compact ? undefined : { height: 40 }}
      footer={compact ? undefined : { height: 28 }}
      className={compact ? "app-shell-compact" : undefined}
    >
      {!compact && (
        <AppShell.Header px={styles.shell.px} pb={0}>
          <Header branding={branding} configured={Boolean(configuredService)} />
        </AppShell.Header>
      )}

      <AppShell.Main>
        <Main configuredService={configuredService} />
      </AppShell.Main>

      {!compact && (
        <AppShell.Footer px={styles.shell.px}>
          <Footer />
        </AppShell.Footer>
      )}
    </AppShell>
  );
}
