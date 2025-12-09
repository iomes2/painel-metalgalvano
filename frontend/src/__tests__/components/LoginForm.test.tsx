import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

// Mock Firebase
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(),
}));

jest.mock("@/lib/firebase", () => ({
  auth: {},
}));

// Mock Next Navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock Toast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock Logo
jest.mock("@/components/icons/Logo", () => () => (
  <div data-testid="logo">Logo</div>
));

describe("LoginForm", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  it("renders login form correctly", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/ID Gerente/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar/i })).toBeInTheDocument();
  });

  it.skip("shows error if fields are empty", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /Entrar/i }));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Erro",
        variant: "destructive",
      })
    );
  });

  it("calls signInWithEmailAndPassword on submit", async () => {
    const user = userEvent.setup();
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/ID Gerente/i), "user1");
    await user.type(screen.getByLabelText("Senha"), "password");

    console.log("Clicking submit button...");
    await user.click(screen.getByRole("button", { name: /Entrar/i }));

    await waitFor(() => {
      console.log("Checking signInWithEmailAndPassword call...");
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "user1@gmail.com",
        "password"
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("handles login error", async () => {
    const user = userEvent.setup();
    const error = { code: "auth/invalid-credential" };
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/ID Gerente/i), "user1");
    await user.type(screen.getByLabelText("Senha"), "password");
    await user.click(screen.getByRole("button", { name: /Entrar/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Falha no Login",
          variant: "destructive",
        })
      );
    });
  });
});
