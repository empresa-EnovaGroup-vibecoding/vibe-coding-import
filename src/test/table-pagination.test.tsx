import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TablePagination } from "@/components/shared/TablePagination";

describe("TablePagination", () => {
  it("does not render when totalCount is less than pageSize", () => {
    const { container } = render(
      <TablePagination page={0} totalCount={10} pageSize={25} onPageChange={() => {}} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders pagination info when totalCount exceeds pageSize", () => {
    render(
      <TablePagination page={0} totalCount={50} pageSize={25} onPageChange={() => {}} />
    );
    expect(screen.getByText("Mostrando 1-25 de 50")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("disables previous button on first page", () => {
    render(
      <TablePagination page={0} totalCount={100} pageSize={25} onPageChange={() => {}} />
    );
    const prevButton = screen.getByRole("button", { name: /anterior/i });
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(
      <TablePagination page={3} totalCount={100} pageSize={25} onPageChange={() => {}} />
    );
    const nextButton = screen.getByRole("button", { name: /siguiente/i });
    expect(nextButton).toBeDisabled();
  });

  it("calls onPageChange when clicking next", async () => {
    const onPageChange = vi.fn();
    render(
      <TablePagination page={0} totalCount={100} pageSize={25} onPageChange={onPageChange} />
    );
    await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange when clicking previous", async () => {
    const onPageChange = vi.fn();
    render(
      <TablePagination page={2} totalCount={100} pageSize={25} onPageChange={onPageChange} />
    );
    await userEvent.click(screen.getByRole("button", { name: /anterior/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("shows correct range on middle page", () => {
    render(
      <TablePagination page={1} totalCount={75} pageSize={25} onPageChange={() => {}} />
    );
    expect(screen.getByText("Mostrando 26-50 de 75")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("shows correct range on last partial page", () => {
    render(
      <TablePagination page={2} totalCount={60} pageSize={25} onPageChange={() => {}} />
    );
    expect(screen.getByText("Mostrando 51-60 de 60")).toBeInTheDocument();
  });
});
