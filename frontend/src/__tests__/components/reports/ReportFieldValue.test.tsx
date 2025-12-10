import { render, screen, fireEvent } from "@testing-library/react";
import { ReportFieldValue } from "@/components/reports/ReportFieldValue";

describe("ReportFieldValue", () => {
  it("renders text value correctly", () => {
    const field = { id: "test", label: "Label", type: "text" as const };
    render(<ReportFieldValue field={field} value="Hello World" />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders empty state correctly", () => {
    const field = { id: "test", label: "Label", type: "text" as const };
    render(<ReportFieldValue field={field} value="" />);
    expect(screen.getByText("Não preenchido")).toBeInTheDocument();
  });

  it("renders date correctly", () => {
    const field = { id: "date", label: "Date", type: "date" as const };
    const date = new Date(2023, 10, 15, 10, 30); // Nov 15 2023
    render(<ReportFieldValue field={field} value={date} />);
    // Format: dd/MM/yyyy 'às' HH:mm -> 15/11/2023 às 10:30
    expect(screen.getByText(/15\/11\/2023/)).toBeInTheDocument();
  });

  it("renders checkbox value correctly", () => {
    const field = { id: "check", label: "Check", type: "checkbox" as const };
    render(<ReportFieldValue field={field} value={true} />);
    expect(screen.getByText("Sim")).toBeInTheDocument();

    render(<ReportFieldValue field={field} value={false} />);
    expect(screen.getByText("Não")).toBeInTheDocument();
  });
});
