import React from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Dashboard from "./components/Dashboard";
import "./App.css";

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "ap-south-1_Qkz7K9VRa",
      userPoolClientId: "46ljukd3i8uhh8uubmdaquqcg2",
    },
  },
});

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <Dashboard user={user} signOut={signOut} />
      )}
    </Authenticator>
  );
}

export default App;
