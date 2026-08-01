import React, {useEffect, useState} from "react";
import {Text, Anchor, Box, Button, Paper, PasswordInput, Stack, TextInput, Title} from "@mantine/core";
import {useForm} from "@mantine/form";
import {useLogin} from "../hooks/LoginInfo.ts";
import {Link} from "react-router-dom";

function LoginScreen() {
  const form = useForm({
    initialValues: {
      username: "",
      password: ""
    }
  });


  useEffect(() => {
    document.title = "MTGit Login";
  }, []);

  const [loginError, setLoginError] = useState("");
  const loginMutation = useLogin();

  useEffect(() => {
    if (loginError) {
      setLoginError("");
    }
  }, [form.values.username, form.values.password]);

  const handleSubmit = async (values: {username: string, password: string}) => {
    try {
      await loginMutation.mutateAsync({
        username: values.username,
        password: values.password
      });
    }
    catch (error) {
      if (error && typeof error === "object" && "data" in error && (error as {
        data?: {httpStatus?: number};
      }).data?.httpStatus === 401) {
        setLoginError("Invalid username or password");
      }

      throw error;
    }
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
      <Paper
        shadow="md"
        p="xl"
        radius="md"
        w={360}
        component="form"
        onSubmit={form.onSubmit(handleSubmit)}
      >
        <Stack>
          <Title order={3} ta="center">
            Login
          </Title>

          <TextInput
            label="Username"
            placeholder="your username"
            {...form.getInputProps("username")}
          />

          <PasswordInput
            label="Password"
            placeholder="your password"
            {...form.getInputProps("password")}
          />

          <Anchor component={Link} to="/register" tabIndex={-1}>
            Register Instead
          </Anchor>

          {loginError && (
            <Text c="red">
              {loginError}
            </Text>
          )}

          <Button
            fullWidth
            type="submit"
            loading={loginMutation.isPending}
            disabled={!form.values.username || !form.values.password}
          >
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default LoginScreen;