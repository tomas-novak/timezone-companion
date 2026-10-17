import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ScrollHint } from "./Concept";

// jsdom has no layout, so the end of the page is wherever the test puts the bottom of #main
let mainBottom = 3000;
const page = () =>
  render(
    <>
      <ScrollHint />
      <main id="main">
        <section id="ask">
          <a href="#ask">Contact</a>
        </section>
      </main>
    </>,
  );
const scrollTo = (bottom: number) => {
  mainBottom = bottom;
  fireEvent.scroll(window);
};

describe("ScrollHint", () => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return { top: 0, bottom: this.id === "main" ? mainBottom : 0 } as DOMRect;
  });
  afterEach(() => {
    cleanup();
    mainBottom = 3000;
  });

  it("steps down by most of a screen", () => {
    const scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    page();
    fireEvent.click(screen.getByRole("button", { name: "Scroll down" }));
    expect(scrollBy).toHaveBeenCalledWith({ top: window.innerHeight * 0.8 });
  });

  it("hides at the end of the page and comes back above it", () => {
    page();
    scrollTo(window.innerHeight);
    expect(screen.queryByRole("button", { name: "Scroll down" })).not.toBeInTheDocument();
    scrollTo(window.innerHeight + 200);
    expect(screen.getByRole("button", { name: "Scroll down" })).toBeInTheDocument();
  });

  it("hands keyboard focus to the Ask link when the focused hint hides", () => {
    page();
    screen.getByRole("button", { name: "Scroll down" }).focus();
    scrollTo(window.innerHeight - 10);
    expect(screen.getByRole("link", { name: "Contact" })).toHaveFocus();
  });
});
