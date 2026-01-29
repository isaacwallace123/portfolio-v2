"use client";

import { logoutAction } from "../model/actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="destructive" className="rounded-2xl">
        Logout
      </Button>
    </form>
  );
}
