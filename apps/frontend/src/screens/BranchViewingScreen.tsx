import React from "react";
import {Grid, Paper, Stack, Text, TextInput} from "@mantine/core";

function BranchViewingScreen(props) {
  return (
    <Grid>
      <Grid.Col span={3}>
        <Paper withBorder h={"85vh"} p={"md"}>
          <Stack h={"100%"}>
            <TextInput/>
            <Text>
              Branch 1
            </Text>
            <Text>
              Branch 2
            </Text>
          </Stack>
        </Paper>
      </Grid.Col>
      <Grid.Col span={9}>
        Nice graph of the whole thing
      </Grid.Col>
    </Grid>
  );
}

export default BranchViewingScreen;