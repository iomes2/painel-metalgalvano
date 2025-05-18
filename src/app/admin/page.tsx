
import { redirect } from 'next/navigation';

export default function AdminBasePage() {
  // Redireciona para a página principal da administração, por exemplo, o construtor de formulários.
  redirect('/admin/form-builder');
}
