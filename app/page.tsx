"use client";

import { useState, useEffect, useRef } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import {
  Authenticator,
  SelectField,
  useAuthenticator,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import {
  signUp,
  SignUpInput,
  getCurrentUser,
  AuthUser,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser>();
  const selectedRoleRef =  useRef<any>(null);

  const fetchUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {}
  };

  Hub.listen("auth", ({ payload }) => {
    switch (payload.event) {
      case "signedIn":
      case "tokenRefresh_failure":
      case "signInWithRedirect":
      case "customOAuthState":
        fetchUser();
        break;
    }
  });

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  useEffect(() => {
    if (currentUser) listTodos();
  }, [currentUser]);

  useEffect(() => {
    fetchUser();
  }, []);

  function createTodo() {
    client.models.Todo.create({
      content: window.prompt("Todo content"),
    });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }
  return (
    <Authenticator
      components={{
        SignUp: {
          FormFields() {
            return (
              <>
                {/* Re-use default `Authenticator.SignUp.FormFields` */}
                <Authenticator.SignUp.FormFields />

                {/* Append & require Terms and Conditions field to sign up  */}
                <SelectField
                  label="role"
                  // value={selectedRole}
                  // onChange={(e) =>
                  //   {
                  //     setSelectedRole(e.target.value as "WORKER" | "BOSS")
                  //   }
                  // }
                  options={["BOSS", "WORKER"]}
                  ref={selectedRoleRef}
                />
              </>
            );
          },
        },
      }}
      services={{
        async handleSignUp(input: SignUpInput) {
          const { username, password, options } = input;
          const customUsername = username.toLowerCase();
          const customEmail = options?.userAttributes?.email?.toLowerCase();
          return signUp({
            username: customUsername,
            password,
            options: {
              ...input.options,
              userAttributes: {
                ...input.options?.userAttributes,
                email: customEmail,
                "custom:group": selectedRoleRef.current?.value,
              },
            },
          });
        },
      }}
    >
      {({ signOut, user }) => (
        <main>
          <h1>My todos</h1>
          <button onClick={createTodo}>+ new</button>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id} onClick={() => deleteTodo(todo.id)}>
                {todo.content}
              </li>
            ))}
          </ul>
          <div>
            🥳 App successfully hosted. Try creating a new todo.
            <br />
            <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">
              Review next steps of this tutorial.
            </a>
          </div>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}
