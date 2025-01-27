import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedTextInput } from "@/components/ThemedTextInput";
import { ThemedView } from "@/components/ThemedView";
import { validateEmail } from "@/services/validators";
import { useState } from "react";
import { Alert, Platform, StyleSheet } from "react-native";

export default function Login() {
  const [email, onEmailChange] = useState("");
  const [password, onPasswordChange] = useState("");
  const login = () => {
    if (!validateEmail(email)) {
      if (Platform.OS === "web") {
        alert("Invalid email address");
      } else {
        Alert.alert("Invalid Input", "Invalid email address");
      }
    }

    if (email === "demo@mail.co" && password === "demo") {
      if (Platform.OS === "web") {
        alert("You are logged in 😜");
      } else {
        Alert.alert("Success", "You are logged in 😜");
      }
    } else {
      if (Platform.OS === "web") {
        alert("Invalid credentials");
      } else {
        Alert.alert("Not found", "Invalid credentials");
      }
    }
  };
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.loginContainer}>
        <ThemedText type="title" style={styles.loginTitle}>
          Login
        </ThemedText>
        <ThemedView style={styles.inputsContainer}>
          <ThemedTextInput
            onChangeText={onEmailChange}
            value={email}
            placeholder="Email"
            inputMode="email"
            autoComplete="email"
            maxLength={32}
          />
          <ThemedTextInput
            onChangeText={onPasswordChange}
            value={password}
            placeholder="Password"
            secureTextEntry={true}
            maxLength={32}
          />
        </ThemedView>
        <ThemedButton title="Login" onPress={login} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginContainer: {
    gap: 30,
    width: "100%",
    padding: 10,
  },
  inputsContainer: {
    gap: 20,
  },
  loginTitle: {
    textAlign: "center",
  },
});
