import type {ReactNode} from "react";
import {Text} from "@mantine/core";

import {Button, Group, Menu, Paper} from "@mantine/core";
import {useAuth} from "../hooks/LoginInfo.ts";

// import style from "./assets/index.module.css"

export function CustomAppShell({children}: {children: ReactNode}) {

  const auth = useAuth();

  return <>
    <Paper withBorder>
      <Group px={"md"} justify={"space-between"}>
        <Paper>
          (App logo)
        </Paper>

        <Menu variant={"gradient"}>
          {/*todo what does this element do?*/}
        </Menu>


        <Group align={"center"}>
          <Text>Logged in as: {auth?.user?.username}</Text> // todo fix when logged out
          <Button variant="filled"
            color={"red"}>Logout</Button>
        </Group>
      </Group>
    </Paper>
    <Paper p={"md"}>
      {children}
    </Paper>
  </>;
}