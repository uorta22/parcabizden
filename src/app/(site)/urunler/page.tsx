import { redirect } from 'next/navigation'

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const q = params.q
  if (q) {
    redirect(`/parcalar?q=${encodeURIComponent(q)}`)
  }
  redirect('/parcalar')
}
