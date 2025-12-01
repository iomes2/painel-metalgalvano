import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

// Mock Auth
jest.mock('@/components/auth/AuthInitializer', () => ({
  useAuth: () => ({
    user: { displayName: 'Test User', email: 'test@example.com' },
  }),
}));

// Mock Navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock Config
jest.mock('@/config/forms', () => ({
  formDefinitions: [
    { id: 'form1', name: 'Form 1', iconName: 'FileText', description: 'Desc 1' },
  ],
}));

// Mock Icons
jest.mock('@/components/icons/icon-resolver', () => ({
  getFormIcon: () => () => <div data-testid="icon">Icon</div>,
}));

// Mock UI Components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <div>Select Value</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}));

describe('Dashboard Page', () => {
  it('renders welcome message', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Bem-vindo\(a\), Test User!/i)).toBeInTheDocument();
    expect(screen.getByText(/Selecione um formulário abaixo para começar/i)).toBeInTheDocument();
  });

  it('renders form selection', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Selecionar Formulário/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir Formulário Selecionado/i })).toBeInTheDocument();
  });
});
