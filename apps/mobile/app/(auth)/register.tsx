import { useState } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";

import { registerPatient } from "@/api/auth";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Input } from "@/components/input";
import { Screen } from "@/components/screen";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      registerPatient({
        email,
        name,
        password,
        phone
      }),
    onSuccess: () => {
      Alert.alert("Done", "Account created. Login next.");
      router.replace("/(auth)/login");
    },
    onError: (error: Error) => {
      Alert.alert("Register failed", error.message);
    }
  });

  return (
    <Screen
      subtitle="Self registration for patients."
      title="Register"
    >
      <Card className="gap-4">
        <Input
          label="Name"
          onChangeText={setName}
          placeholder="Asha Patel"
          value={name}
        />
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="asha@example.com"
          value={email}
        />
        <Input
          keyboardType="phone-pad"
          label="Phone"
          onChangeText={setPhone}
          placeholder="+91 9876543210"
          value={phone}
        />
        <Input
          label="Password"
          onChangeText={setPassword}
          placeholder="Minimum 6 chars"
          secureTextEntry
          value={password}
        />
        <Button
          loading={mutation.isPending}
          onPress={() => mutation.mutate()}
        >
          Create account
        </Button>
      </Card>
    </Screen>
  );
}
