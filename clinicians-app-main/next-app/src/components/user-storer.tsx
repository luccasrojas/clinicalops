"use client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect } from "react";
import { api } from "../../convex/_generated/api";

const UserStorer = () => {
  const { isSignedIn } = useAuth();
  const user = useQuery(api.users.getUser);
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (user && isSignedIn) {
      storeUser();
    }
  }, [user, isSignedIn]);
  return null;
};

export default UserStorer;
