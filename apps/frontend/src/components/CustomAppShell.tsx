import type {ReactNode} from "react";
import {Text} from '@mantine/core';

import {Button, Group, Menu, Paper, Select} from "@mantine/core";

// import style from "./assets/index.module.css"

export function CustomAppShell({children}: { children: ReactNode }) {

  return <>
    <Paper withBorder>
      <Group px={"md"} justify={"space-between"}>
        <Paper>
          (App logo)
        </Paper>
        <Select label={"Branch:"} p={"xs"} data={["long-term", "experimental", "owned"]} defaultValue={"long-term"}
                searchable/>

        <Menu variant={"gradient"}>

        </Menu>


        <Group align={"center"}>
          <Text>Logged in as: LUMIN42</Text>
          <Button variant="filled"
                  color={"red"}>Logout</Button>
        </Group>
      </Group>
    </Paper>
    <Paper p={"md"}>
      {children}
    </Paper>
  </>
}