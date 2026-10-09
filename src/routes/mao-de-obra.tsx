import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/mao-de-obra")({ component: () => <Outlet /> });
