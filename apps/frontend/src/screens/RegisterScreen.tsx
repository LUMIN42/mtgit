import React, {useState} from "react";
import {Anchor, Box, Button, Paper, PasswordInput, Stack, TextInput, Title} from "@mantine/core";
import {Link} from "react-router-dom";
import {trpcHooks} from "../trpcClient.ts";

function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpcHooks.useUtils();
  const registerMutation = trpcHooks.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    }
  });

  const handleSubmit = async () => {
    await registerMutation.mutateAsync({
      username,
      password
    });
  };

  return (
    <Box
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Paper shadow="md" p="xl" radius="md" w={360}>
        <Stack>
          <Title order={3} ta="center">
            Register
          </Title>

          <TextInput
            label="Username"
            placeholder="choose a username"
            value={username}
            onChange={e => setUsername(e.currentTarget.value)}
          />

          <PasswordInput
            label="Password"
            placeholder="choose a password"
            value={password}
            onChange={e => setPassword(e.currentTarget.value)}
          />

          <Anchor component={Link} to="/login">
            Back to login
          </Anchor>

          <Button
            fullWidth
            onClick={handleSubmit}
            loading={registerMutation.isPending}
            disabled={!username || !password}
          >
            Sign up
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default RegisterScreen;
