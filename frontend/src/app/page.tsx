import type { Metadata } from "next";
import WelcomePage from "@/components/welcome/WelcomePage";

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Integrated Savings and Credit Management System for SACCO members and staff.",
};

export default function HomePage() {
  return <WelcomePage />;
}
