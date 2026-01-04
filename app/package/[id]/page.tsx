import PackageClient from './PackageClient'

export default async function PackagePage({
  params
}: {
  params: { id: string }
}) {
  return <PackageClient packageId={params.id} />
}