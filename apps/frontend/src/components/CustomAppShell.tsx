import type {ReactNode} from "react";
import {Text, Button, Group, Menu, Paper} from "@mantine/core";
import {useAuth} from "../hooks/LoginInfo.ts";
import {useNavigate} from "react-router-dom";
import {trpcHooks} from "../trpcClient.ts";

export function CustomAppShell({children}: {children: ReactNode}) {
  const auth = useAuth();
  const navigate = useNavigate();

  const utils = trpcHooks.useUtils();
  const logoutMutation = trpcHooks.auth.logout.useMutation(
    {
      onSuccess: async () => {
        await utils.auth.me.invalidate();
        navigate("/");
      }
    }
  );

  return (
    <>
      <Paper
        mb={"xs"}
        radius={0}
        style={{
          background: "linear-gradient(0deg, #fdc, #fec)",
          // boxShadow: "0 0px 10px rgba(0, 0, 0, 0.25)",
          zIndex: 2
        }}
      >
        <Group px="md" justify="space-between">

          {/* LEFT SIDE */}
          <Group gap="sm">
            <Text fw={"bolder"}>
              MTGit
            </Text>

            <Button
              variant="subtle"
              size="xs"
              onClick={() => navigate("/app/decks")}
            >
              Decks
            </Button>
          </Group>

          {/* CENTER / MENU */}
          <Menu variant="gradient">
            {/* todo */}
          </Menu>

          {/* RIGHT SIDE */}
          <Group align="center">
            <Text>
              Logged in as: {auth?.user?.username ?? "Guest"}
            </Text>

            <Button
              loading={logoutMutation.isPending}
              variant="subtle"
              color="red"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper p="md">{children}</Paper>
    </>
  );
}