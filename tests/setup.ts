import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => searchParams,
}));
