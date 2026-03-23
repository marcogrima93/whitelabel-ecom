import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { Category } from "@/types/database";

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link key={category.id} href={`/products?category=${category.id}`}>
          <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
            <div className="relative aspect-square bg-muted">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted-foreground/10">
                  <span className="text-2xl font-bold text-muted-foreground/30">
                    {category.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <CardContent className="p-3 text-center">
              <h3 className="font-medium text-sm">{category.name}</h3>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
