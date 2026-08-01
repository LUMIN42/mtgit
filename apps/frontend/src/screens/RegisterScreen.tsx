import React, {useEffect} from "react";
import {Anchor, Box, Button, Paper, PasswordInput, Stack, TextInput, Title} from "@mantine/core";
import {useForm} from "@mantine/form";
import {Link} from "react-router-dom";
import {trpcHooks} from "../trpcClient.ts";

function RegisterScreen() {
  const form = useForm({
    initialValues: {
      username: "",
      password: "",
      repeatPassword: ""
    },
    validate: {
      repeatPassword: (value, values) => value === values.password ? null : "Passwords do not match"
    }
  });

  useEffect(() => {
    document.title = "MTGit Register";
  }, []);

  const utils = trpcHooks.useUtils();
  const registerMutation = trpcHooks.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
    },
    onError: error => {
      if (error.data?.httpStatus === 409) {
        form.setFieldError("username", "Username already exists");
      }
    }
  });

  useEffect(() => {
    if (form.errors.username) {
      form.clearFieldError("username");
    }
  }, [form.values.username]);

  const handleSubmit = async (values: {username: string, password: string, repeatPassword: string}) => {
    await registerMutation.mutateAsync({
      username: values.username,
      password: values.password
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
            Register
          </Title>

          <TextInput
            label="Username"
            {...form.getInputProps("username")}
          />

          <PasswordInput
            label="Password"
            {...form.getInputProps("password")}
          />

          <PasswordInput
            label="Repeat Password"
            {...form.getInputProps("repeatPassword")}
          />

          <Anchor component={Link} to="/login" tabIndex={-1}>
            Back to login
          </Anchor>

          <Button
            fullWidth
            type="submit"
            loading={registerMutation.isPending}
            disabled={
              !form.values.username ||
              !form.values.password ||
              !form.values.repeatPassword ||
              form.values.password !== form.values.repeatPassword
            }
          >
            Sign up
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default RegisterScreen;
