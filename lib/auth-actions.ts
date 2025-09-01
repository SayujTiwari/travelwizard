"use server"
// logic for sign in and out
import  { signIn, signOut } from "@/auth";


export const login = async() => {
    await signIn("github", {redirectTo: "/"});
};

export const logout = async() => {
    await signOut({redirectTo: "/"});
};