import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MetricCard } from "./MetricCard";
import { Calendar } from "lucide-react";

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(
      <MemoryRouter>
        <MetricCard title="Citas Hoy" value={5} icon={Calendar} />
      </MemoryRouter>
    );
    expect(screen.getByText("Citas Hoy")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <MemoryRouter>
        <MetricCard title="Ingresos" value="Q500" icon={Calendar} description="Este mes" />
      </MemoryRouter>
    );
    expect(screen.getByText("Este mes")).toBeInTheDocument();
  });

  it("is keyboard accessible when href is provided", () => {
    render(
      <MemoryRouter>
        <MetricCard title="Clientes" value={10} icon={Calendar} href="/clients" />
      </MemoryRouter>
    );
    const card = screen.getByRole("link");
    expect(card).toHaveAttribute("tabindex", "0");
    expect(card).toHaveAttribute("aria-label", "Clientes");
  });

  it("has no link role when href is not provided", () => {
    render(
      <MemoryRouter>
        <MetricCard title="Total" value={100} icon={Calendar} />
      </MemoryRouter>
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
