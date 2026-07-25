type WorkSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WorkSlugPage({ params }: WorkSlugPageProps) {
  const { slug } = await params;

  return (
    <main>
      Work / {slug} (stub)
    </main>
  );
}
