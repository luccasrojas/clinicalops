import { SignIn } from "@clerk/nextjs";
import React from "react";

export const SignInView = () => {
  return (
    <>
      {/* <h1>Test</h1> */}
      <SignIn routing="hash" />
    </>
  );
};
