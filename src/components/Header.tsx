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
import { IconNetwork, IconMoon, IconSun } from "@tabler/icons-react";

import { ResourceView } from "@/components/common/ResourceView";
import { useLoadService } from "@/store/hooks";
import { openDialog } from "@/store/actions";
import styles from "@/components/common/styles";

export default function Header() {
  const [navbarOpened, { toggle: toggleNavbar }] = useDisclosure();
  const { toggleColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme();
  const serviceState = useLoadService();
  const IconColorScheme = colorScheme === "dark" ? IconSun : IconMoon;
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
            <Text size={"xl"} fw={600}>
              Eozilla
            </Text>
            <Text size={"xl"} fw={200}>
              🦖
            </Text>
          </Group>
        </Flex>
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
      </Flex>
    </>
  );
}
