// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material";
import { describe, expect, it } from "vitest";
import { MatchHighlight } from "./MatchHighlight";

function renderHighlight(text: string, query: string) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <div data-testid="result">
        <MatchHighlight text={text} query={query} />
      </div>
    </ThemeProvider>,
  );
}

describe("MatchHighlight", () => {
  it("renders matched segments as marked text", () => {
    renderHighlight("Bright Garden", "bright");

    const result = screen.getByTestId("result");
    expect(result).toHaveTextContent("Bright Garden");
    expect(result.querySelector("mark")).toHaveTextContent("Bright");
  });

  it("renders plain text when the query is empty or unmatched", () => {
    const { rerender } = renderHighlight("Bright Garden", "");
    expect(screen.getByTestId("result").querySelector("mark")).toBeNull();

    rerender(
      <ThemeProvider theme={createTheme()}>
        <div data-testid="result">
          <MatchHighlight text="Bright Garden" query="water" />
        </div>
      </ThemeProvider>,
    );
    expect(screen.getByTestId("result").querySelector("mark")).toBeNull();
  });
});
