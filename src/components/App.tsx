import { AppShell } from "@mantine/core";

import "./App.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Main from "@/components/Main";
import styles from "@/components/common/styles";

export default function App() {
  return (
    <AppShell
      withBorder={false}
      header={{ height: 40 }}
      footer={{ height: 28 }}
    >
      <AppShell.Header px={styles.shell.px}>
        <Header />
      </AppShell.Header>

      <AppShell.Main px={styles.shell.px} pb={styles.shell.py}>
        <Main />
      </AppShell.Main>

      <AppShell.Footer px={styles.shell.px}>
        <Footer />
      </AppShell.Footer>
    </AppShell>
  );
}
