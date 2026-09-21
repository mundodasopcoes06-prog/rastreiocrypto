import { redirect } from 'next/navigation';
import { IDIOMA_PADRAO } from '@/lib/dicionario';

export default function Raiz() {
  redirect(`/${IDIOMA_PADRAO}`);
}
