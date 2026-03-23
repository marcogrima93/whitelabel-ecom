import { notFound } from "next/navigation";
import { getPageBySlug } from "@/modules/ecom/lib/queries";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await getPageBySlug(params.slug);
  if (!page) return { title: "Not Found" };
  return { title: page.seo_title || page.title, description: page.seo_description };
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const page = await getPageBySlug(params.slug);
  if (!page) notFound();

  const content = page.content as any;
  const blocks = content?.blocks || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
      <div className="prose prose-neutral max-w-none">
        {blocks.map((block: any, i: number) => {
          if (block.type === "heading") return <h2 key={i}>{block.text}</h2>;
          if (block.type === "paragraph") return <p key={i}>{block.text}</p>;
          return null;
        })}
      </div>
    </div>
  );
}
