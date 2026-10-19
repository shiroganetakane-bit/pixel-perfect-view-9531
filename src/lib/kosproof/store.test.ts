import { describe, expect, it } from "vitest";
import { canMove } from "./store";

describe("alur status deposit", () => {
  it("ditahan bisa diajukan potongan", () => expect(canMove("ditahan", "diajukan")).toBe(true));
  it("diajukan bisa disetujui", () => expect(canMove("diajukan", "disetujui")).toBe(true));
  it("disetujui bisa dikembalikan", () => expect(canMove("disetujui", "dikembalikan")).toBe(true));
  it("dikembalikan tidak bisa berubah lagi", () => expect(canMove("dikembalikan", "ditahan")).toBe(false));
  it("ditahan tidak bisa langsung disetujui", () => expect(canMove("ditahan", "disetujui")).toBe(false));
});
