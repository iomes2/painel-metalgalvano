import { render, screen, fireEvent } from "@testing-library/react";
import { DynamicField } from "@/components/forms/DynamicField";
import { useForm, FormProvider } from "react-hook-form";
import { Form } from "@/components/ui/form";

// Mock Next Navigation
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: jest.fn() }),
}));

// Components Mocks
jest.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div data-testid="calendar">Calendar</div>,
}));
jest.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm();
  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
};

describe("DynamicField", () => {
  it("renders text input correctly", () => {
    const TestComponent = () => {
      const form = useForm();
      const field = {
        id: "test",
        label: "Test Label",
        type: "text" as const,
        placeholder: "Enter text",
      };
      return (
        <Form {...form}>
          <DynamicField
            field={field}
            control={form.control}
            isSubmitting={false}
          />
        </Form>
      );
    };

    render(<TestComponent />);
    // Check for label existence
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    // Check for input existence via placeholder
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders checkbox correctly", () => {
    const TestComponent = () => {
      const form = useForm();
      const field = {
        id: "check",
        label: "Check Label",
        type: "checkbox" as const,
      };
      return (
        <Form {...form}>
          <DynamicField
            field={field}
            control={form.control}
            isSubmitting={false}
          />
        </Form>
      );
    };
    render(<TestComponent />);
    expect(screen.getByText("Check Label")).toBeInTheDocument();
    // Checkbox rendering might vary depending on ShadCN implementation (button vs input)
    // usually role="checkbox"
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });
});
