import {
  ActionIcon,
  Burger,
  Flex,
  Group,
  Text,
  useMantineColorScheme,
  useComputedColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import {
  IconLogin,
  IconLogout,
  IconMoon,
  IconNetwork,
  IconSun,
} from "@tabler/icons-react";

import { ResourceView } from "@/components/common/ResourceView";
import { useLoadService } from "@/store/hooks";
import { openDialog, signOut } from "@/store/actions";
import styles from "@/components/common/styles";
import { DEFAULT_APP_BRANDING, type AppBranding } from "@/config/bootstrap";

export default function Header({
  branding = DEFAULT_APP_BRANDING,
  configured = false,
}: {
  branding?: AppBranding;
  configured?: boolean;
}) {
  const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure();
  const { toggleColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme();
  const serviceState = useLoadService();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const connected = Boolean(serviceState.service && !serviceState.error);
  const SessionIcon = connected ? IconLogout : IconLogin;
  const sessionActionLabel = connected ? "Log out" : "Log in";
  const IconColorScheme = colorScheme === "dark" ? IconSun : IconMoon;
  const icon =
    "url" in branding.icon ? (
      <img src={branding.icon.url} alt="" height={24} />
    ) : (
      <Text size={"xl"} fw={200}>
        {branding.icon.emoji}
      </Text>
    );

  async function handleSessionAction() {
    if (!connected) {
      openDialog("service");
      return;
    }
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <Flex h="100%" align={"center"}>
        <Burger
          opened={navbarOpened}
          onClick={toggleNavbar}
          hiddenFrom="sm"
          size="sm"
        />
        <Flex flex={1} justify={"center"}>
          <Group gap={5}>
            {branding.iconPosition === "before" && icon}
            <Text size={"xl"} fw={600}>
              {branding.title}
            </Text>
            {branding.iconPosition === "after" && icon}
          </Group>
        </Flex>
        {configured ? (
          <ActionIcon
            {...styles.actionIcon.md}
            aria-label={sessionActionLabel}
            title={sessionActionLabel}
            loading={serviceState.isLoading || isLoggingOut}
            onClick={handleSessionAction}
          >
            <SessionIcon {...styles.icon.md} />
          </ActionIcon>
        ) : (
          <Group>
            <ResourceView {...serviceState} nullText="No service selected.">
              {(service) =>
                service ? (
                  <Text {...styles.text.id3} size={"sm"}>
                    {service.providerId}
                  </Text>
                ) : (
                  <Text {...styles.text.unavailable} size={"xs"}>
                    No service selected.
                  </Text>
                )
              }
            </ResourceView>
            <ActionIcon.Group>
              <ActionIcon
                {...styles.actionIcon.md}
                onClick={() => openDialog("service")}
                disabled={serviceState.isLoading}
                loading={serviceState.isLoading}
              >
                <IconNetwork {...styles.icon.md} />
              </ActionIcon>
              <ActionIcon
                {...styles.actionIcon.md}
                onClick={() => toggleColorScheme()}
                disabled={serviceState.isLoading}
                loading={serviceState.isLoading}
              >
                <IconColorScheme {...styles.icon.md} />
              </ActionIcon>
            </ActionIcon.Group>
          </Group>
        )}
      </Flex>
    </>
  );
}
