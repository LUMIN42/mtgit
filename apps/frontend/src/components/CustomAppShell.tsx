import type {ReactNode} from "react";
import {Text, Button, Group, Menu, Paper} from "@mantine/core";
import {useAuth} from "../hooks/LoginInfo.ts";
import {useNavigate} from "react-router-dom";

export function CustomAppShell({children}: {children: ReactNode}) {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Paper withBorder>
        <Group px="md" justify="space-between">

          {/* LEFT SIDE */}
          <Group gap="sm">
            <Paper>(App logo)</Paper>

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

            <Button variant="filled" color="red">
              Logout
            </Button>
          </Group>
        </Group>
      </Paper>

      <Paper p="md">{children}</Paper>
    </>
  );
}