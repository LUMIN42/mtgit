import React, {useState} from "react";
import {Anchor, Box, Button, Paper, PasswordInput, Stack, TextInput, Title} from "@mantine/core";
import {useLogin} from "../hooks/LoginInfo.ts";
import {Link} from "react-router-dom";

function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLogin();

  const handleSubmit = async () => {
    await loginMutation.mutateAsync({
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
            Login
          </Title>

          <TextInput
            label="Username"
            placeholder="your username"
            value={username}
            onChange={e => setUsername(e.currentTarget.value)}
          />

          <PasswordInput
            label="Password"
            placeholder="your password"
            value={password}
            onChange={e => setPassword(e.currentTarget.value)}
          />

          <Anchor component={Link} to={"/register"}>
            Register
          </Anchor>

          <Button
            fullWidth
            onClick={handleSubmit}
            loading={loginMutation.isPending}
            disabled={!username || !password}
          >
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default LoginScreen;